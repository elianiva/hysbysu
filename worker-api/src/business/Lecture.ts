export const LECTURE_TYPE = {
	resource: "resource",
	assignment: "assignment",
	url: "url",
	quiz: "quiz",
	forum: "forum",
	page: "page",
	unknown: "unknown",
} as const;

export type LectureType = keyof typeof LECTURE_TYPE;

// can't use class since it's too expensive to map from json object -> class
export type Lecture = {
	name: string;
	url: string;
	type: LectureType;
	deadline: Date | undefined;
}

export function compareLecture(left: Lecture, right: Lecture) {
	return left.name === right.name && left.url === right.url && left.type === right.type;
}
