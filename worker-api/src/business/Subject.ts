import type { Lecturer } from "./Lecturer";
import type { Meeting } from "./Meeting";

export type Subject = {
	title: string;
	lecturer: Lecturer;
	courseId: string;
	meetings: Meeting[];
};
