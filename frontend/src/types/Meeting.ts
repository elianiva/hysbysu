import type { Lecture } from "~/types/Lecture";

export type Meeting = {
	subject: string;
	title: string;
	lectures: Lecture[];
};
