package models

type Subject struct {
	Title    string    `json:"title"`
	Lecturer Lecturer  `json:"lecturer"`
	CourseId string    `json:"courseId"`
	Meetings []Meeting `json:"meetings"`
}
