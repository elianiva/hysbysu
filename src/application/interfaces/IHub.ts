import type { MeetingUpdate } from "~/domain/MeetingUpdate";
import type { IPresenter } from "./IPresenter";

export interface IHub {
	emit(meetingUpdate: MeetingUpdate): Promise<void>;
	addPresenter(presenter: IPresenter): void;
}
