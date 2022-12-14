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
	Remind(reminders []model.ReminderItem) ([]model.ReminderItem, error)
	Error(errorDetail error) error
}

type scraper struct {
	config    Config
	client    *httpClient
	collector Collector
	presenter Presenter
	busy      bool
	shutdown  chan bool
}

var ErrClosed = errors.New("scraper closed")

func NewScraper(config Config, client *httpClient, collector Collector, presenter Presenter) *scraper {
	shutdown := make(chan bool, 1)
	busy := false
	return &scraper{config, client, collector, presenter, busy, shutdown}
}

func (s *scraper) RunScraper() {
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
				log.Println("There is an error, logging...")
				err := s.presenter.Error(err)
				if err != nil {
					log.Print(err.Error())
				}
			}
			log.Println("finished scraping...")
			s.busy = false

			log.Println("waiting interval...")

			// TODO(elianiva): revisit this, is this correct?
			select {
			case <-s.shutdown:
				log.Println("shutting down...")
				return
			case <-time.After(s.config.ScrapeInterval):
				log.Println("continuing...")
				continue
			}
		}
	}
}

func (s *scraper) scrape() error {
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

	remindersChan := make(chan []model.ReminderItem, len(newSubjects))
	eg, _ := errgroup.WithContext(context.TODO())
	for _, newSubject := range newSubjects {
		newSubject := newSubject
		eg.Go(func() error {
			oldSubjectFilePath := path.Join(s.config.CWD, "snapshots", newSubject.CourseId+".json")
			_, err := os.Stat(oldSubjectFilePath)

			// TODO(elianiva): simplify, this code looks a bit sus
			var hasOldFile bool
			if err == nil || os.IsExist(err) {
				hasOldFile = true
			}
			if err != nil && !os.IsNotExist(err) {
				return errors.Wrap(err, "failed to check if file already exists or not")
			}

			var oldSubject model.Subject
			if hasOldFile {
				oldSubjectFile, err := os.Open(oldSubjectFilePath)
				if err != nil {
					return errors.Wrap(err, "failed to open the file to decode")
				}
				defer oldSubjectFile.Close()

				err = json.NewDecoder(oldSubjectFile).Decode(&oldSubject)
				if err != nil {
					return errors.Wrap(err, "failed to decode old subject data")
				}
			}

			var meetingsDiff []model.Meeting
			if len(oldSubject.Meetings) > 0 && len(newSubject.Meetings) > 0 && hasOldFile {
				// get the diff for meetings
				meetingsDiff = s.getMeetingsDiff(oldSubject, newSubject)
				if len(meetingsDiff) > 0 {
					err := s.presenter.Notify(model.Subject{
						Lecturer: newSubject.Lecturer,
						CourseId: newSubject.CourseId,
						Meetings: meetingsDiff,
					})
					if err != nil {
						log.Print(err.Error())
					}
				}
			}

			log.Println("Collecting reminder items for: " + newSubject.CourseId)
			futureAssignments := s.getReminderItems(newSubject)
			remindersChan <- futureAssignments

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

	log.Println("Reading reminder queue...")
	reminderFilepath := path.Join(s.config.CWD, "snapshots", "reminder_queue.json")
	reminderFile, err := os.Open(reminderFilepath)
	if err != nil {
		return errors.Wrap(err, "failed to open the file to decode")
	}
	defer reminderFile.Close()

	var oldReminders []model.ReminderItem
	err = json.NewDecoder(reminderFile).Decode(&oldReminders)
	if err != nil {
		return errors.Wrap(err, "failed to decode reminders")
	}

	// used to store old reminders that hasn't been reminded yet and upcoming reminders
	mergedReminders := make([]model.ReminderItem, 0)
	for _, oldReminder := range oldReminders {
		if !oldReminder.HasBeenReminded {
			mergedReminders = append(mergedReminders, oldReminder)
		}
	}
	for _, newReminder := range <-remindersChan {
		isExist := false
		for _, reminder := range mergedReminders {
			if newReminder.Compare(reminder.Lecture) {
				isExist = true
				break
			}
		}
		if !isExist {
			mergedReminders = append(mergedReminders, newReminder)
		}
	}

	// check for notification queue that we use to remind assignment deadline
	reminders, err := s.presenter.Remind(mergedReminders)
	if err != nil {
		return errors.Wrap(err, "Failed to send reminders")
	}

	// saves the updated reminders
	log.Println("Updating reminders...")
	newReminderFilePath := path.Join(s.config.CWD, "snapshots", "reminder_queue.json")
	newReminderFile, err := os.Create(newReminderFilePath)
	if err != nil {
		return errors.Wrap(err, "failed to open the file to decode")
	}
	defer newReminderFile.Close()

	err = json.NewEncoder(newReminderFile).Encode(reminders)
	if err != nil {
		return errors.Wrap(err, "failed to save updated reminders")
	}

	log.Println("cleaning up cookies...")
	s.client.ResetCookies()

	return nil
}

func (s *scraper) Shutdown(ctx context.Context) {
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

func (s *scraper) getMeetingsDiff(oldSubject model.Subject, newSubject model.Subject) []model.Meeting {
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

func (s *scraper) getLecturesDiff(oldMeeting model.Meeting, newMeeting model.Meeting) []model.Lecture {
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

func (s *scraper) getReminderItems(subject model.Subject) []model.ReminderItem {
	var assignments []model.ReminderItem
	for _, meeting := range subject.Meetings {
		for _, lecture := range meeting.Lectures {
			hasPassed := time.Now().UnixMilli() > lecture.Deadline
			if !hasPassed {
				assignments = append(assignments, model.ReminderItem{
					Lecture:         lecture,
					SubjectName:     meeting.Subject,
					HasBeenReminded: false,
				})
			}
		}
	}
	return assignments
}
