import type { Lecturer } from "~/types/Lecturer";
import type { Meeting } from "~/types/Meeting";

export type Subject = {
	title: string;
	lecturer: Lecturer;
	courseId: string;
	meetings: Meeting[];
};
