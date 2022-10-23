import type { IPresenter } from "~/application/interfaces/IPresenter";
import type { Meeting } from "~/domain/Meeting";

export class DummyPresenter implements IPresenter {
	public async notify(id: string, meeting: Meeting): Promise<void> {
		console.log(id, meeting);
	}
}
