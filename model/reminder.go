package model

type ReminderItem struct {
	Lecture
	SubjectName     string
	HasBeenReminded bool
}
