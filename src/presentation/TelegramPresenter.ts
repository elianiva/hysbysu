import type { Bot } from "grammy";
import type { IPresenter } from "~/application/interfaces/IPresenter";
import type { Meeting } from "~/domain/Meeting";

export class TelegramPresenter implements IPresenter {
	private readonly _bot: Bot;

	constructor(bot: Bot) {
		this._bot = bot;
	}

	public async notify(id: string, meeting: Meeting): Promise<void> {
		const formattedMessage = this.formatMessage(meeting);
		await this._bot.api.sendMessage(id, formattedMessage);
	}

	private formatMessage(meeting: Meeting) {
		return `
		New meeting item from **${meeting.subject}**!

		${meeting.lectures.map((lecture) => `- [${lecture.name}](${lecture.url})`).join("\n")}
		`;
	}
}
