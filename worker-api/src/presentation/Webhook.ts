import { ofetch } from "ofetch";
import type { FetchOptions } from "ofetch/dist/node";
import type { IWebhook } from "~/application/interfaces/IWebhook";
import type { Subject } from "~/business/Subject";
import type { Env } from "~/types/env";

// currently only support sending to the discord notification API, soon it should support multiple webhook urls
export class Webhook implements IWebhook {
	#env: Env;

	constructor(env: Env) {
		this.#env = env;
	}

	async #fetch(path: string, options: FetchOptions = {}) {
		return ofetch(`${this.#env.NOTIFICATION_API_BASE_URL}/api/${path}`, {
			...options,
			method: "POST",
			headers: {
				// to prevent people abusing the discord bot
				// when the webhook api is supported, we should improve this handling
				"X-Api-Key": this.#env.NOTIFICATION_API_SECRET,
			},
		});
	}

	public error(message: string): Promise<void> {
		return this.#fetch("send-error", {
			body: {
				message,
			},
		});
	}

	public info(message: string): Promise<void> {
		return this.#fetch("send-info", {
			body: {
				message,
			},
		});
	}

	public notify(subject: Subject): Promise<void> {
		return this.#fetch("send-notification", {
			body: {
				subject,
			},
		});
	}
}
