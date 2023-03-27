export const LECTURE_TYPE = {
	assignment: "assignment",
	forum: "forum",
	quiz: "quiz",
	resource: "resource",
	url: "url",
	page: "page",
	unknown: "unknown",
} as const;

export type LectureType = keyof typeof LECTURE_TYPE;

export type Lecture = {
	name: string;
	url: string;
	type: LectureType;
};
