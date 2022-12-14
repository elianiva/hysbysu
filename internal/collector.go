package internal

import (
	"bytes"
	"context"
	"hysbysu/model"
	"io"
	"log"
	"net/url"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/pkg/errors"
	"golang.org/x/sync/errgroup"
)

const (
	el_subjectCard       = ".gallery_grid_item.md-card-content > a"
	el_subjectName       = ".page-header-headings"
	el_topicItem         = ".topics > li .content"
	el_sectionTitle      = ".sectionname"
	el_lectureList       = "ul.section > li"
	el_activityInstance  = ".activityinstance a"
	el_instanceName      = ".instancename"
	el_modtypeResource   = "modtype_resource"
	el_modtypeAssignment = "modtype_assign"
	el_modtypeQuiz       = "modtype_quiz"
	el_modtypeUrl        = "modtype_url"
	el_modtypeForum      = "modtype_forum"
	el_summaryImages     = ".summary img"
	el_lecturerName      = ".summary td strong"
)

type goQueryCollector struct {
	config Config
	client *httpClient
}

var (
	MissingLectureHref  = errors.New("failed to get lecture href property")
	MissingLectureClass = errors.New("failed to get activityinstance class property")
)

func NewCollector(config Config, client *httpClient) *goQueryCollector {
	return &goQueryCollector{config, client}
}

func (c goQueryCollector) CollectSubjectLinks(html io.Reader) ([]string, error) {
	document, err := goquery.NewDocumentFromReader(html)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse slc document")
	}

	var urls []string
	document.Find(el_subjectCard).Each(func(_ int, a *goquery.Selection) {
		href, exists := a.Attr("href")
		if exists {
			urls = append(urls, href)
		}
	})
	return urls, nil
}

func (c goQueryCollector) collectMeetings(html io.Reader) ([]model.Meeting, error) {
	document, err := goquery.NewDocumentFromReader(html)
	if err != nil {
		return nil, errors.Wrap(err, "failed to collect meetings")
	}

	meetings := make([]model.Meeting, 0)
	subjectName := document.Find(el_subjectName).Text()

	// skip one because the first topicEl is just the detail of the course
	topicEl := document.Find(el_topicItem).Slice(1, goquery.ToEnd)
	for _, topicNode := range topicEl.Nodes {
		selection := goquery.NewDocumentFromNode(topicNode).Selection
		meeting, err := c.extractMeeting(selection)
		if err != nil {
			return nil, errors.Wrap(err, "failed to extract meeting detail")
		}
		meeting.Subject = subjectName
		meetings = append(meetings, meeting)
	}

	return meetings, nil
}

func (c goQueryCollector) extractMeeting(s *goquery.Selection) (meeting model.Meeting, err error) {
	sectionTitle := s.Find(el_sectionTitle).Text()

	lectures := make([]model.Lecture, 0)
	lectureEl := s.Find(el_lectureList)

	for _, lectureNode := range lectureEl.Nodes {
		selection := goquery.NewDocumentFromNode(lectureNode).Selection
		lecture, err := c.extractLecture(selection)
		if err != nil {
			// these errors are not fatal, we'll just ignore them
			if errors.Is(err, MissingLectureHref) || errors.Is(err, MissingLectureClass) {
				continue
			}

			return model.Meeting{}, errors.Wrap(err, "failed to extract meeting")
		}
		lectures = append(lectures, lecture)
	}

	return model.Meeting{
		Subject:  "", // will be filled later
		Title:    sectionTitle,
		Lectures: lectures,
	}, nil
}

func (c goQueryCollector) extractLecture(s *goquery.Selection) (model.Lecture, error) {
	activityInstance := s.Find(el_activityInstance)

	classAttrib, exists := s.Attr("class")
	if !exists {
		return model.Lecture{}, MissingLectureClass
	}

	lectureName := activityInstance.Find(el_instanceName).Text()
	lectureUrl, exists := activityInstance.Attr("href")
	if !exists {
		return model.Lecture{}, MissingLectureHref
	}

	isResource := strings.Contains(classAttrib, el_modtypeResource)
	isAssignment := strings.Contains(classAttrib, el_modtypeAssignment)
	isQuiz := strings.Contains(classAttrib, el_modtypeQuiz)
	isUrl := strings.Contains(classAttrib, el_modtypeUrl)
	isForum := strings.Contains(classAttrib, el_modtypeForum)

	var deadline int64
	var lectureType model.LectureType = model.LectureUnknown

	if isResource {
		lectureType = model.LectureResource
	} else if isAssignment {
		lectureType = model.LectureAssignment
		parsedDeadline, err := c.getAssignmentDeadline(lectureUrl)
		if err != nil {
			return model.Lecture{}, err
		}
		deadline = parsedDeadline
	} else if isQuiz {
		lectureType = model.LectureQuiz
	} else if isUrl {
		lectureType = model.LectureUrl
	} else if isForum {
		lectureType = model.LectureForum
	}

	lecture := model.Lecture{
		Name:     lectureName,
		Url:      lectureUrl,
		Type:     lectureType,
		Deadline: deadline,
	}
	return lecture, nil
}

func (c goQueryCollector) getAssignmentDeadline(lectureUrl string) (int64, error) {
	html, err := c.client.Get(lectureUrl, nil)
	if err != nil {
		return 0, errors.Wrap(err, "failed to fetch lecture detail")
	}
	rawDeadline, err := c.collectDeadlineInfo(html.Body)
	if err != nil {
		return 0, errors.Wrap(err, "failed to extract deadline information")
	}
	parsedDeadline, err := time.ParseInLocation("Monday, 2 January 2006, 15:04 PM", rawDeadline, c.config.TimeZone)
	if err != nil {
		return 0, errors.Wrap(err, "failed to parse deadline")
	}
	return parsedDeadline.In(c.config.TimeZone).UnixMilli(), nil
}

func (c goQueryCollector) collectLecturerInfo(html io.Reader) (model.LecturerInfo, error) {
	document, err := goquery.NewDocumentFromReader(html)
	if err != nil {
		return model.LecturerInfo{}, errors.Wrap(err, "failed to parse ")
	}

	lecturerName := document.Find(el_lecturerName).First().Text()
	// TODO(elianiva): use proper placeholder profile image
	//                 maybe take from the config?
	lecturerImage := document.Find(el_summaryImages).Nodes[1]
	lecturerImageUrl := goquery.NewDocumentFromNode(lecturerImage).AttrOr("src", "https://twirpz.files.wordpress.com/2015/06/twitter-avi-gender-balanced-figure.png")

	// conditionally append the protocol to handle the lecturer image source correctly
	if !strings.HasPrefix(lecturerImageUrl, "https://") {
		lecturerImageUrl = "https:" + lecturerImageUrl
	}

	return model.LecturerInfo{
		Name:     lecturerName,
		ImageUrl: lecturerImageUrl,
	}, nil
}

func (c goQueryCollector) collectDeadlineInfo(html io.Reader) (string, error) {
	document, err := goquery.NewDocumentFromReader(html)
	if err != nil {
		return "", errors.Wrap(err, "cannot create lecture detail document")
	}

	deadlineText := goquery.NewDocumentFromNode(document.Find("tr").Nodes[2]).Find(".lastcol").Text()
	return deadlineText, nil
}

func (c goQueryCollector) CollectSubjects(subjectContent io.Reader) ([]model.Subject, error) {
	links, err := c.CollectSubjectLinks(subjectContent)
	if err != nil {
		return nil, errors.Wrap(err, "failed to collect subject links")
	}

	subjects := make([]model.Subject, 0)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	eg, _ := errgroup.WithContext(ctx)
	for _, link := range links {
		courseUrl, err := url.Parse(link)
		courseId := courseUrl.Query().Get("id")
		if err != nil {
			return nil, errors.Wrap(err, "invalid lms url can't be parsed")
		}

		lmsLink := link
		eg.Go(func() error {
			log.Println("collecting data for: " + courseId)
			lmsContent, err := c.client.FetchLmsContent(lmsLink)
			if err != nil {
				return err
			}

			// TODO(elianiva): handle this silly stream->string->stream conversion properly
			//                 we can't consume the reader twice
			lmsContentStr, err := io.ReadAll(lmsContent)
			if err != nil {
				return errors.Wrap(err, "failed to read lms content stream")
			}

			meetings, err := c.collectMeetings(bytes.NewReader(lmsContentStr))
			if err != nil {
				return err
			}

			lectureInfo, err := c.collectLecturerInfo(bytes.NewReader(lmsContentStr))
			if err != nil {
				return err
			}

			subjects = append(subjects, model.Subject{
				Lecturer: lectureInfo,
				CourseId: courseId,
				Meetings: meetings,
			})
			log.Println("done with: " + courseId)

			return nil
		})
	}
	err = eg.Wait()
	if err != nil {
		return nil, errors.Wrap(err, "failed to collect subject")
	}

	return subjects, nil
}
