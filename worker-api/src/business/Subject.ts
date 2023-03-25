import { Lecturer } from "./Lecturer";
import { Meeting } from "./Meeting";
import { ArgumentError } from "./exceptions/ArgumentError";

export class Subject {
	public lecturer: Lecturer;
	public courseId: string;
	public meetings: Meeting[];

	constructor(lecturer: Lecturer, courseId: string, meetings: Meeting[]) {
		if (courseId.length === 0) throw new ArgumentError("courseId");
		this.lecturer = lecturer;
		this.courseId = courseId;
		this.meetings = meetings;
	}
}
