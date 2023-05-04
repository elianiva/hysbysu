import type { ILogger } from "~/application/interfaces/ILogger";

// noop logger used for production, since logging stuff on prod took too much cpu time lol
export class NoopLogger implements ILogger {
	debug(text: string) {
		return;
	}

	info(text: string) {
		return;
	}

	error(text: string) {
		return;
	}

	warn(text: string) {
		return;
	}
}
