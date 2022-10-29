package model

import "testing"

func TestCompareSameLecture(t *testing.T) {
	lecture1 := Lecture{
		Name: "123",
		Url:  "123",
		Type: "unknown",
	}
	lecture2 := Lecture{
		Name: "123",
		Url:  "123",
		Type: "unknown",
	}
	same := lecture1.Compare(lecture2)
	if !same {
		t.Fatalf("lecture1 and lecture2 should be the same")
	}
}

func TestCompareDifferentLecture(t *testing.T) {
	lecture1 := Lecture{
		Name: "asdf",
		Url:  "foo",
		Type: LectureAssignment,
	}
	lecture2 := Lecture{
		Name: "asdf",
		Url:  "foo",
		Type: LectureUnknown,
	}
	same := lecture1.Compare(lecture2)
	if same {
		t.Fatalf("lecture1 and lecture2 should be different")
	}
}
