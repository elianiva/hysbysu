import type { Browser } from "puppeteer";
import type { IBrowser } from "~/domain/interfaces/IBrowser";
import type { IPage } from "~/domain/interfaces/IPage";
import { PuppeteerPage } from "./PuppeteePage";

export class PuppeteerBrowser implements IBrowser {
	private readonly _browser: Browser;

	constructor(browser: Browser) {
		this._browser = browser;
	}

	public async getPages(): Promise<IPage[]> {
		const pages = await this._browser.pages();
		return pages.map((page) => new PuppeteerPage(page));
	}

	public async getFirstPage(): Promise<IPage> {
		const page = (await this._browser.pages())[0];
		return new PuppeteerPage(page);
	}

	public async newPage() {
		const page = await this._browser.newPage();
		return new PuppeteerPage(page);
	}
}
