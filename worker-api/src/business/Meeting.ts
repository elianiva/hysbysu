import { Lecture } from "./Lecture";
import { ArgumentError } from "./exceptions/ArgumentError";

export class Meeting {
	public subject: string;
	public title: string;
	public lectures: Lecture[];

	constructor(subject: string, title: string, lectures: Lecture[]) {
		if (subject.length === 0) throw new ArgumentError("subject");
		if (title.length === 0) throw new ArgumentError("title");
		this.subject = subject;
		this.title = title;
		this.lectures = lectures;
	}

	public compare(other: Meeting) {
		return this.subject === other.subject && this.title === other.title;
	}
}
