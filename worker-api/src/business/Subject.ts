import { Lecture } from "./Lecture";
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

	public static fromJson(json: string | null): Subject | null {
		if (json === null) return null;
		const oldSubject = JSON.parse(json) as Subject;
		return new Subject(
			new Lecturer(oldSubject.lecturer.name, oldSubject.lecturer.imageUrl),
			oldSubject.courseId,
			oldSubject.meetings.map(
				(meeting) =>
					new Meeting(
						meeting.subject,
						meeting.title,
						meeting.lectures.map(
							(lecture) => new Lecture(lecture.name, lecture.url, lecture.type, lecture.deadline)
						)
					)
			)
		);
	}
}
