import { Subject } from "~/business/Subject";

export interface IWebhook {
	notify(subject: Subject): Promise<void>;
	info(message: string): Promise<void>;
	error(message: string): Promise<void>;
}
