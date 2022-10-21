import { ValidationError } from "./errors/ValidationError";
import type { Lecture } from "./Lecture";

type MeetingOption = {
	subject: string;
	title: string;
	lectures: Lecture[];
};

export class Meeting {
	public readonly subject: MeetingOption["subject"];
	public readonly name: MeetingOption["title"];
	public readonly lectures: MeetingOption["lectures"];

	constructor(opts: MeetingOption) {
		if (opts.subject.length < 1) throw new ValidationError("subject");
		if (opts.title.length < 1) throw new ValidationError("title");

		this.subject = opts.subject;
		this.name = opts.title;
		this.lectures = opts.lectures;
	}
}
