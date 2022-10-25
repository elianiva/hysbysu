import type { IHub } from "~/application/interfaces/IHub";
import type { IPresenter } from "~/application/interfaces/IPresenter";
import type { MeetingUpdate } from "~/domain/MeetingUpdate";

export class Hub implements IHub {
	private _presenters: IPresenter[] = [];

	public async emit(meetingUpdate: MeetingUpdate): Promise<void> {
		for (const presenter of this._presenters) {
			// TODO(elianiva): is leaving dangling promise acceptable?
			presenter.notify(meetingUpdate);
		}
	}

	public addPresenter(presenter: IPresenter): void {
		this._presenters.push(presenter);
	}
}
