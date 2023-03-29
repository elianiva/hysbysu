import { Lecture } from "./Lecture";

export type Meeting = {
	subject: string;
	title: string;
	lectures: Lecture[];
}

export function compareMeeting(left: Meeting, right: Meeting) {
	return left.subject === right.subject && left.title === right.title;
}