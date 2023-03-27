import type { ILogger } from "~/application/interfaces/ILogger";

export class ConsoleLogger implements ILogger {
	private readonly _debugPrefix = "[DEBUG] >";
	private readonly _infoPrefix = "[INFO] >";
	private readonly _errorPrefix = "[ERROR] >";
	private readonly _warnPrefix = "[WARN] >";

	private getTimestamp() {
		return new Date().toLocaleString();
	}

	debug(text: string) {
		console.info(`${this.getTimestamp()} ${this._debugPrefix} ${text}`);
	}

	info(text: string) {
		console.info(`${this.getTimestamp()} ${this._infoPrefix} ${text}`);
	}

	error(text: string) {
		console.error(`${this.getTimestamp()} ${this._errorPrefix} ${text}`);
	}

	warn(text: string) {
		console.warn(`${this.getTimestamp()} ${this._warnPrefix} ${text}`);
	}
}
