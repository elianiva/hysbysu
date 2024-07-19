import type { IWebhook } from "~/application/interfaces/IWebhook";
import type { Subject } from "~/business/Subject";
import type { Env } from "~/env";
import type { FetchOptions } from "ofetch/dist/node";
import { ofetch } from "ofetch";

export class TelegramWebhook implements IWebhook {
	#env: Env;

	constructor(env: Env) {
		this.#env = env;
	}

	async #fetch(message: string, options: FetchOptions = {}) {
		return ofetch(
			`https://api.telegram.org/bot${this.#env.TELEGRAM_TOKEN}/sendMessage?parse_mode=HTML`,
			{
				...options,
				headers: {
					"Content-Type": "application/json",
				},
				method: "POST",
				body: {
					chat_id: this.#env.TELEGRAM_CHAT_ID,
					text: message,
				},
				parseResponse(response) {
					console.log(response);
					return response;
				},
			},
		);
	}

	notify(subject: Subject): Promise<void> {
		// create a formatted message
		const message = `<b>New course update!</b>
<b>Title:</b> ${subject.title}
<b>Lecturer:</b> ${subject.lecturer.name}
<b>Meetings:</b>
${subject.meetings
	.map((meeting) => {
		return `\t<b>Title:</b> ${meeting.title}
\t<b>Lectures:</b>
${meeting.lectures
	.filter((lecture) => lecture !== undefined)
	.map((lecture) => {
		return `\t- <a href="${lecture.url}">${lecture.name} (${
			lecture.deadline?.toLocaleDateString("en-GB", {
				year: "numeric",
				month: "long",
				day: "numeric",
				weekday: "long",
			}) ?? "no deadline"
		})</a>`;
	})
	.join("\n")}
`;
	})
	.join("\n\n")}
`;
		return this.#fetch(message);
	}

	info(message: string): Promise<void> {
		return this.#fetch(`INFO: ${message}`);
	}

	error(message: string): Promise<void> {
		return this.#fetch(`ERROR: ${message}`);
	}
}
