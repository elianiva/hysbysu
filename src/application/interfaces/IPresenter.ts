import type { MeetingUpdate } from "~/domain/MeetingUpdate";

export interface IPresenter {
	notify(meeting: MeetingUpdate): Promise<void>;
}
