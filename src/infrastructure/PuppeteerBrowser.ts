import type { Browser } from "puppeteer";
import type { IBrowser } from "~/domain/interfaces/IBrowser";
import type { IPage } from "~/domain/interfaces/IPage";
import type { ISanitizer } from "~/domain/interfaces/ISanitizer";
import { PuppeteerPage } from "./PuppeteePage";

export class PuppeteerBrowser implements IBrowser {
	private readonly _browser: Browser;
	private readonly _sanitizer: ISanitizer;

	constructor(browser: Browser, sanitizer: ISanitizer) {
		this._browser = browser;
		this._sanitizer = sanitizer;
	}

	public async getFirstPage(): Promise<IPage> {
		const page = (await this._browser.pages())[0];
		return new PuppeteerPage(page, this._sanitizer);
	}

	public async newPage() {
		const page = await this._browser.newPage();
		return new PuppeteerPage(page, this._sanitizer);
	}
}
