package model

type Subject struct {
	Lecturer LecturerInfo
	CourseId string
	Meetings []Meeting
}
