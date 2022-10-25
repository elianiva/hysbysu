import { Browser, launch } from "puppeteer";
import type { IBrowser } from "~/domain/interfaces/IBrowser";
import type { IPage } from "~/domain/interfaces/IPage";
import { CHROME_BIN, IS_DEV } from "~/env";
import { PuppeteerPage } from "./PuppeteePage";

export class PuppeteerBrowser implements IBrowser {
	private _browser: Browser | undefined;

	public async launch(): Promise<void> {
		if (this._browser !== undefined) return;
		this._browser = await launch({
			headless: !IS_DEV,
			args: [
				// Required for Docker version of Puppeteer
				"--no-sandbox",
				"--disable-setuid-sandbox",
				// This will write shared memory files into /tmp instead of /dev/shm,
				// because Docker’s default for /dev/shm is 64MB
				"--disable-dev-shm-usage",
			],
			executablePath: IS_DEV ? undefined : CHROME_BIN,
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
			throw err;
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
			throw err;
		}
	}

	public async newPage() {
		try {
			await this.launch();
			const page = await this._browser!.newPage();
			return new PuppeteerPage(page);
		} catch (err) {
			throw err;
		}
	}
}
