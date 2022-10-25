import console from "node:console";
import * as c from "colorette";
import type { ILogger } from "~/domain/interfaces/ILogger";

export class ConsoleLogger implements ILogger {
  private readonly _debugPrefix = c.bold(c.blue("[DEBUG] ➤ "));
  private readonly _infoPrefix = c.bold(c.green("[INFO] ➤ "));
  private readonly _errorPrefix = c.bold(c.red("[ERROR] ➤ "));
  private readonly _warnPrefix = c.bold(c.yellow("[WARN] ➤ "));

  private getTimestamp() {
    return c.gray(new Date().toLocaleString());
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
