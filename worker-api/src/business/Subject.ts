import { Lecturer } from "./Lecturer";
import { Meeting } from "./Meeting";

export type Subject = {
	title: string;
	lecturer: Lecturer;
	courseId: string;
	meetings: Meeting[];
}
