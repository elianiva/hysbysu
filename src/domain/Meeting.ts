import { ValidationError } from "./errors/ValidationError";
import type { Lecture } from "./Lecture";

export type MeetingOption = {
	subject: string;
	title: string;
	lectures: Lecture[];
};

export class Meeting {
	public readonly subject: MeetingOption["subject"];
	public readonly title: MeetingOption["title"];
	public readonly lectures: MeetingOption["lectures"];

	constructor(opts: MeetingOption) {
		if (opts.subject === undefined || opts.subject.length < 1) throw new ValidationError("subject");
		if (opts.title === undefined || opts.title.length < 1) throw new ValidationError("title");

		this.subject = opts.subject;
		this.title = opts.title;
		this.lectures = opts.lectures;
	}
}
