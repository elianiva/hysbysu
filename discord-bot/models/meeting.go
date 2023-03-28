package models

type Meeting struct {
	Subject  string    `json:"subject"`
	Title    string    `json:"title"`
	Lectures []Lecture `json:"lectures"`
}
