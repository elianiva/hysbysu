import type { IPresenter } from "~/application/interfaces/IPresenter";
import type { MeetingUpdate } from "~/domain/MeetingUpdate";

export class DummyPresenter implements IPresenter {
	public async notify(meeting: MeetingUpdate): Promise<void> {
		console.log(meeting);
	}
}
