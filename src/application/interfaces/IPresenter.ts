import type { Meeting } from "~/domain/Meeting";

export interface IPresenter {
	notify(id: string, meeting: Meeting): Promise<void>;
}
