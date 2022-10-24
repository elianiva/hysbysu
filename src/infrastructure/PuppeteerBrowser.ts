import { Browser, launch } from "puppeteer";
import type { IBrowser } from "~/domain/interfaces/IBrowser";
import type { IPage } from "~/domain/interfaces/IPage";
import { IS_DEV } from "~/env";
import { PuppeteerPage } from "./PuppeteePage";

export class PuppeteerBrowser implements IBrowser {
	private _browser: Browser | undefined;

	public async launch(): Promise<void> {
		if (this._browser !== undefined) return;
		this._browser = await launch({
			headless: !IS_DEV,
			args: ["--no-sandbox", "--disable-gpu"],
		});
	}

	public async close(): Promise<void> {
		await this._browser?.close();
		this._browser = undefined;
	}

	public async getPages(): Promise<IPage[]> {
		try {
			await this.launch();
			const pages = await this._browser!.pages();
			return pages?.map((page) => new PuppeteerPage(page)) ?? [];
		} catch (err) {
			throw new Error("Failed to launch browser");
		}
	}

	/**
	 * Gets the first page from the browser, or create a new one if it doesn't exist yet
	 */
	public async getFirstPage(): Promise<IPage> {
		try {
			await this.launch();
			const page = (await this._browser!.pages()).at(0);
			if (page === undefined) return this.newPage();
			return new PuppeteerPage(page);
		} catch (err) {
			throw new Error("failed to launch browser");
		}
	}

	public async newPage() {
		try {
			await this.launch();
			const page = await this._browser!.newPage();
			return new PuppeteerPage(page);
		} catch (err) {
			throw new Error("failed to launch browser");
		}
	}
}
