import { Subject } from "~/business/Subject";

export interface ICollector {
	collectSubjects(rawSubjects: string): Promise<Subject[]>;
}
