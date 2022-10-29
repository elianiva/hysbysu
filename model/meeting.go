package model

type Meeting struct {
	Subject  string
	Title    string
	Lectures []Lecture
}

// Compare will only compare the primitive typed property
func (lhs Meeting) Compare(rhs Meeting) bool {
	return lhs.Subject == rhs.Subject && lhs.Title == rhs.Title
}
