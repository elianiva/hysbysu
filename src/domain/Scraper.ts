import type { IBrowser } from "./interfaces/IBrowser";
import type { IPage } from "./interfaces/IPage";
import type { IStorage } from "./interfaces/IStorage";
import type { IMeetingCollector } from "./interfaces/ICollector";
import { NotInitializedError } from "./errors/NotInitializedError";
import { ValidationError } from "./errors/ValidationError";

type ScraperOptions = {
	siakadUrl: string;
	lmsUrl: string;
	nim: string;
	password: string;
};

type ScraperDeps = {
	browser: IBrowser;
	storage: IStorage;
	collector: IMeetingCollector;
};

export class Scraper {
	private readonly USERNAME_INPUT = 'input[name="username"]';
	private readonly PASSWORD_INPUT = 'input[name="password"]';
	private readonly LOGIN_BUTTON = 'button[type="submit"]';
	private readonly GOTO_LMS_BUTTON = 'a[class="btn btn-sm green"]';
	private readonly LMS_BUTTON = 'a[alt="Siakad-LMS Connector"]';
	private readonly LECTURE_URL = ".gallery_grid_item.md-card-content a";

	private readonly _siakadUrl: string;
	private readonly _lmsUrl: string;
	private readonly _nim: string;
	private readonly _password: string;

	private _storage: IStorage;
	private _browser: IBrowser;
	private _collector: IMeetingCollector;
	private _page: IPage | undefined;

	constructor(options: ScraperOptions, deps: ScraperDeps) {
		if (options.siakadUrl.length === 0) throw new ValidationError("siakadUrl");
		if (options.lmsUrl.length === 0) throw new ValidationError("lmsUrl");
		if (options.nim.length === 0) throw new ValidationError("nim");
		if (options.password.length === 0) throw new ValidationError("password");

		this._siakadUrl = options.siakadUrl;
		this._lmsUrl = options.lmsUrl;
		this._nim = options.nim;
		this._password = options.password;

		this._browser = deps.browser;
		this._storage = deps.storage;
		this._collector = deps.collector;
	}

	/**
	 * Initialise a new page if it doesn't exist yet. If it already does, it will act as a noop
	 */
	public async init() {
		if (this._page !== undefined) return;
		this._page = await this._browser.getFirstPage();
	}

	/**
	 * Scrapes the LMS for any new resource
	 */
	public async scrape() {
		if (this._page === undefined) throw new NotInitializedError("this._page");

		await this.login();
		await this.goToLMS();
		await this.savePageSnapshots();
		await this.cleanUp();
	}

	private async cleanUp() {
		const pages = await this._browser.getPages();
		for await (const page of pages) {
			page.close();
		}
	}

	private async login() {
		if (this._page === undefined) throw new NotInitializedError("this._page");

		await this._page.visit(this._siakadUrl);
		await this._page.insert(this.USERNAME_INPUT, this._nim);
		await this._page.insert(this.PASSWORD_INPUT, this._password);
		await this._page.clickButton(this.LOGIN_BUTTON);
	}

	private async goToLMS() {
		if (this._browser === undefined) throw new NotInitializedError("this._browser");
		if (this._page === undefined) throw new NotInitializedError("this._page");

		await this._page.waitForNetworkIdle();
		await this._page.clickButton(this.LMS_BUTTON);
		await this._page.clickButton(this.GOTO_LMS_BUTTON, { useNativeClick: true });
		await this._page.close();
		this._page = await this._browser.newPage();
		await this._page.visit(this._lmsUrl);
	}

	private async savePageSnapshots() {
		if (this._browser === undefined) throw new NotInitializedError("this._browser");
		if (this._page === undefined) throw new NotInitializedError("this._page");

		const urls = await this._page.getAttributesFromElements(this.LECTURE_URL, "href");
		const timestamp = Date.now();
		const tasks = urls.map(async (url) => {
			const page = await this._browser.newPage();
			await page.visit(this._lmsUrl + url);
			const html = await page.getContent();
			const meetings = this._collector.collect(html);
			await this._storage.put(`${timestamp}_${url.slice(-4)}`, JSON.stringify(meetings));
			await page.close();
		});
		await Promise.all(tasks);
	}
}
