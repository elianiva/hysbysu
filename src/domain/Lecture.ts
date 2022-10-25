import { ValidationError } from "./errors/ValidationError";

export type LectureType = "resource" | "assignment" | "url" | "quiz" | "unknown";

type LectureOptions = {
	name: string;
	url: string;
	type: LectureType;
};

export class Lecture {
	public readonly name: LectureOptions["name"];
	public readonly url: LectureOptions["url"];
	public readonly type: LectureOptions["type"];

	constructor(opts: LectureOptions) {
		if (opts.name === undefined || opts.name.length < 1) throw new ValidationError("name");
		if (opts.name === undefined || opts.url.length < 1) throw new ValidationError("url");
		if (opts.name === undefined || opts.type.length < 1) throw new ValidationError("type");

		this.name = opts.name;
		this.url = opts.url;
		this.type = opts.type;
	}
}
