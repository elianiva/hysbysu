package model

type HistoryItem struct {
	// duration to scrape in milliseconds
	DurationMilliseconds int64
	Success              bool
	NewLectures          []Lecture
	TimeStamp            int64
}
