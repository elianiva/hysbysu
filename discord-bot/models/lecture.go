package models

type LectureType string

const (
	LectureResource   LectureType = "resource"
	LectureAssignment LectureType = "assignment"
	LectureUrl        LectureType = "url"
	LectureQuiz       LectureType = "quiz"
	LectureForum      LectureType = "forum"
	LecturePage       LectureType = "page"
	LectureUnknown    LectureType = "unknown"
)

type Lecture struct {
	Name     string      `json:"name"`
	Url      string      `json:"url"`
	Type     LectureType `json:"type"`
	Deadline int64       `json:"deadline"`
}
