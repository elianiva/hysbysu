import { Subject } from "~/business/Subject";

export type CollectSubjectOptions = {
	slice: {
		start: number;
		end: number;
	};
};

export interface ICollector {
	collectSubjects(rawSubjects: string, options: CollectSubjectOptions): Promise<Subject[]>;
}
