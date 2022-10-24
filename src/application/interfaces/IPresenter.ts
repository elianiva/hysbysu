import type { Meeting } from "~/domain/Meeting";

export interface IPresenter {
	notify(meeting: Meeting): Promise<void>;
}
