package internal

import (
	"context"
	"encoding/json"
	"hysbysu/model"
	"io"
	"log"
	"os"
	"path"
	"time"

	"github.com/pkg/errors"
	"golang.org/x/sync/errgroup"
)

type Collector interface {
	CollectSubjects(subjectContent io.Reader) ([]model.Subject, error)
}

type Presenter interface {
	Notify(subject model.Subject) error
}

type Scraper struct {
	config    Config
	client    *HttpClient
	collector Collector
	presenter Presenter
	busy      bool
	shutdown  chan bool
}

var ErrClosed = errors.New("scraper closed")

func NewScraper(config Config, client *HttpClient, collector Collector, presenter Presenter) *Scraper {
	shutdown := make(chan bool, 1)
	busy := false
	return &Scraper{config, client, collector, presenter, busy, shutdown}
}

func (s *Scraper) RunScraper() {
	for {
		select {
		case <-s.shutdown:
			return
		default:
			log.Println("scraping...")
			s.busy = true
			err := s.scrape()
			if err != nil {
				if errors.Is(err, ErrClosed) {
					break
				}

				log.Fatalf("failed to scrape. reason: %v", err)
			}
			log.Println("finished scraping...")
			s.busy = false

			log.Println("waiting interval...")

			// TODO(elianiva): revisit this, is this correct?
			for {
				select {
				case <-s.shutdown:
					log.Println("shutting down...")
					return
				case <-time.After(s.config.ScrapeInterval):
					continue
				}
			}
		}
	}
}

func (s *Scraper) scrape() error {
	err := s.client.CollectCookies()
	if err != nil {
		return errors.Wrap(err, "failed to collect cookies")
	}

	subjectContent, err := s.client.FetchSubjectsContent()
	if err != nil {
		return errors.Wrap(err, "failed to fetch lhs list content")
	}

	newSubjects, err := s.collector.CollectSubjects(subjectContent)
	if err != nil {
		return errors.Wrap(err, "failed to collect lhs detail")
	}

	eg, _ := errgroup.WithContext(context.TODO())
	for _, newSubject := range newSubjects {
		newSubject := newSubject
		eg.Go(func() error {
			oldSubjectFile, err := os.Open(path.Join(s.config.CWD, "snapshots", newSubject.CourseId+".json"))
			hasOldFile := !errors.Is(err, os.ErrNotExist)
			if err != nil && !hasOldFile {
				return errors.Wrap(err, "failed to open the file to decode")
			}

			var oldSubject model.Subject
			if err == nil {
				err = json.NewDecoder(oldSubjectFile).Decode(&oldSubject)
				if err != nil {
					return errors.Wrap(err, "failed to decode old subject data")
				}
			}

			var meetingsDiff []model.Meeting
			if len(oldSubject.Meetings) > 0 && hasOldFile {
				// get the diff for meetings
				meetingsDiff = s.getMeetingsDiff(oldSubject, newSubject)
				s.presenter.Notify(model.Subject{
					Lecturer: newSubject.Lecturer,
					CourseId: newSubject.CourseId,
					Meetings: meetingsDiff,
				})
			}

			// save the snapshot for future diffing
			log.Println("saving course id: " + newSubject.CourseId)

			fileName := path.Join(s.config.CWD, "snapshots", newSubject.CourseId+".json")
			file, err := os.Create(fileName)
			if err != nil {
				return errors.Wrap(err, "failed to open the file to encode")
			}

			err = json.NewEncoder(file).Encode(newSubject)
			if err != nil {
				return errors.Wrap(err, "failed to save the snapshot")
			}

			log.Println("finished writing " + fileName)
			return nil
		})
	}
	err = eg.Wait()
	if err != nil {
		return errors.Wrap(err, "failed to save the snapshots")
	}

	log.Println("cleaning up cookies...")
	s.client.ResetCookies()

	return nil
}

func (s *Scraper) Shutdown(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			log.Println("timeout exceeded, forcing it to shutdown...")
			return
		default:
			s.shutdown <- true
			if !s.busy {
				return
			}
			log.Println("scraper is busy, will try to wait...")
			continue
		}
	}
}

func (s *Scraper) getMeetingsDiff(oldSubject model.Subject, newSubject model.Subject) []model.Meeting {
	oldLen := len(oldSubject.Meetings)
	newLen := len(newSubject.Meetings)
	result := make([]model.Meeting, 0)

	if newLen > oldLen {
		result = append(result, newSubject.Meetings[oldLen:]...)
	}

	for meetingIdx, meeting := range newSubject.Meetings[:oldLen] {
		same := meeting.Compare(oldSubject.Meetings[meetingIdx])
		lecturesDiff := s.getLecturesDiff(oldSubject.Meetings[meetingIdx], meeting)
		if same && len(lecturesDiff) < 1 {
			continue
		}
		result = append(result, model.Meeting{
			Subject:  meeting.Subject,
			Title:    meeting.Title,
			Lectures: lecturesDiff,
		})
	}

	return result
}

func (s *Scraper) getLecturesDiff(oldMeeting model.Meeting, newMeeting model.Meeting) []model.Lecture {
	oldLen := len(oldMeeting.Lectures)
	newLen := len(newMeeting.Lectures)
	result := make([]model.Lecture, 0)

	if newLen > oldLen {
		result = append(result, newMeeting.Lectures[oldLen:]...)
	}

	if oldLen == newLen {
		for lectureIdx, oldLecture := range oldMeeting.Lectures {
			currentLecture := newMeeting.Lectures[lectureIdx]
			same := oldLecture.Compare(newMeeting.Lectures[lectureIdx])
			if same {
				continue
			}
			result = append(result, currentLecture)
		}
	}

	return result
}
