import { ValidationError } from "./errors/ValidationError";
import type { Lecture } from "./Lecture";

type MeetingOption = {
	subject: string;
	name: string;
	lectures: Lecture[];
};

export class Meeting {
	public readonly subject: MeetingOption["subject"];
	public readonly name: MeetingOption["name"];
	public readonly lectures: MeetingOption["lectures"];

	constructor(opts: MeetingOption) {
		if (opts.subject.length < 1) throw new ValidationError("name");
		if (opts.name.length < 1) throw new ValidationError("name");

		this.subject = opts.subject;
		this.name = opts.name;
		this.lectures = opts.lectures;
	}
}
