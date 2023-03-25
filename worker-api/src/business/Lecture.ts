import { ArgumentError } from "./exceptions/ArgumentError";

export const LECTURE_TYPE = {
	resource: "resource",
	assignment: "assignment",
	url: "url",
	quiz: "quiz",
	forum: "forum",
	unknown: "unknown",
} as const;

export type LectureType = keyof typeof LECTURE_TYPE;

export class Lecture {
	public name: string;
	public url: string;
	public type: LectureType;
	public deadline: Date | undefined;

	constructor(name: string, url: string, type: LectureType, deadline: Date | undefined) {
		if (name.length === 0) throw new ArgumentError("name");
		if (url.length === 0) throw new ArgumentError("url");
		if (type.length === 0 || LECTURE_TYPE[type] === undefined) throw new ArgumentError("url");
		this.name = name;
		this.url = url;
		this.type = type;
		this.deadline = deadline;
	}

	public compare(other: Lecture) {
		return this.name === other.name && this.url === other.url && this.type === other.type;
	}
}
