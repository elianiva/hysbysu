package model

import "testing"

func TestCompareSameMeeting(t *testing.T) {
	meeting1 := Meeting{
		Subject:  "asdf",
		Title:    "asdf",
		Lectures: []Lecture{},
	}
	meeting2 := Meeting{
		Subject:  "asdf",
		Title:    "asdf",
		Lectures: []Lecture{},
	}
	same := meeting1.Compare(meeting2)
	if !same {
		t.Fatalf("meeting1 and meeting2 should be the same")
	}
}

func TestCompareDifferentMeeting(t *testing.T) {
	meeting1 := Meeting{
		Subject:  "foo",
		Title:    "foo",
		Lectures: []Lecture{},
	}
	meeting2 := Meeting{
		Subject:  "asdf",
		Title:    "a",
		Lectures: []Lecture{},
	}
	same := meeting1.Compare(meeting2)
	if same {
		t.Fatalf("meeting1 and meeting2 should be different")
	}
}

func TestCompareMeetingWithDifferentLectures(t *testing.T) {
	meeting1 := Meeting{
		Subject: "asdf",
		Title:   "asdf",
		Lectures: []Lecture{
			{Name: "asdf", Url: "asdf", Type: LectureResource},
		},
	}
	meeting2 := Meeting{
		Subject:  "asdf",
		Title:    "asdf",
		Lectures: []Lecture{},
	}
	same := meeting1.Compare(meeting2)
	if !same {
		t.Fatalf("meeting1 and meeting2 should be the same")
	}
}
