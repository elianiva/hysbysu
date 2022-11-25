package model

type LectureType string

const (
	LectureResource   LectureType = "resource"
	LectureAssignment LectureType = "assignment"
	LectureUrl        LectureType = "url"
	LectureQuiz       LectureType = "quiz"
	LectureForum      LectureType = "forum"
	LectureUnknown    LectureType = "unknown"
)

type Lecture struct {
	Name     string
	Url      string
	Type     LectureType
	Deadline string `json:"omitempty"`
}

// Compare will only compare primitive typed property
func (lhs Lecture) Compare(rhs Lecture) bool {
	return lhs.Name == rhs.Name &&
		lhs.Url == rhs.Url &&
		lhs.Type == rhs.Type
}
