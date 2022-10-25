import type { Bot } from "grammy";
import type { IPresenter } from "~/application/interfaces/IPresenter";
import type { Lecture } from "~/domain/Lecture";
import { MeetingUpdate, MeetingUpdateKind } from "~/domain/MeetingUpdate";

export class TelegramPresenter implements IPresenter {
	private readonly _bot: Bot;
	private readonly _targetId: string;

	constructor(bot: Bot, targetId: string) {
		this._bot = bot;
		this._targetId = targetId;
	}

	public async notify(meeting: MeetingUpdate): Promise<void> {
		await this._bot.api.sendMessage(this._targetId, this.formatMessage(meeting), {
			parse_mode: "HTML",
		});
	}

	private formatMessage(meeting: MeetingUpdate) {
		let message = "";

		if (meeting.kind === MeetingUpdateKind.NEW) {
			message += "📚 New meeting has been added!\n\n";
		}
		if (meeting.kind === MeetingUpdateKind.EDITED) {
			message += "📝 A meeting has been edited!\n\n";
		}

		message += `<b>Title:</b> ${meeting.title}\n`;
		message += `<b>Subject:</b> ${meeting.subject}\n`;
		const assignments = meeting.lectures.filter((lecture) => lecture.type === "assignment");
		if (assignments.length > 0) {
			message += this.buildLectureList("Assignments", assignments);
		}
		const resources = meeting.lectures.filter((lecture) => lecture.type === "resource");
		if (resources.length > 0) {
			message += this.buildLectureList("Resources", resources);
		}
		const quizzes = meeting.lectures.filter((lecture) => lecture.type === "quiz");
		if (quizzes.length > 0) {
			message += this.buildLectureList("Quizzes", quizzes);
		}
		const urls = meeting.lectures.filter((lecture) => lecture.type === "url");
		if (urls.length > 0) {
			message += this.buildLectureList("Files", urls);
		}

		return message;
	}

	private buildLectureList(title: string, lectures: Lecture[]): string {
		let message = `<b>${title}:</b>\n`;
		for (const assignment of lectures) {
			message += `• <a href="${assignment.url}">${assignment.type} - ${assignment.name}</a>\n`;
		}
		return message;
	}
}
