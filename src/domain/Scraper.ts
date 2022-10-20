import type { IBrowser } from "~/domain/interfaces/IBrowser";
import type { IPage } from "~/domain/interfaces/IPage";
import type { IStorage } from "~/domain/interfaces/IStorage";
import { NotInitializedError } from "./errors/NotInitializedError";
import { ValidationError } from "./errors/ValidationError";

type ScraperOptions = {
	siakadUrl: string;
	lmsSlcUrl: string;
	lmsUrl: string;
	nim: string;
	password: string;
};

type ScraperDeps = {
	browser: IBrowser;
	storage: IStorage;
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
	private readonly _lmsSlcUrl: string;
	private readonly _nim: string;
	private readonly _password: string;

	private _storage: IStorage;
	private _browser: IBrowser;
	private _page: IPage | undefined;

	constructor(options: ScraperOptions, deps: ScraperDeps) {
		if (options.siakadUrl.length === 0) throw new ValidationError("siakadUrl");
		if (options.lmsSlcUrl.length === 0) throw new ValidationError("lmsSlcUrl");
		if (options.lmsUrl.length === 0) throw new ValidationError("lmsUrl");
		if (options.nim.length === 0) throw new ValidationError("nim");
		if (options.password.length === 0) throw new ValidationError("password");

		this._siakadUrl = options.siakadUrl;
		this._lmsSlcUrl = options.lmsSlcUrl;
		this._lmsUrl = options.lmsUrl;
		this._nim = options.nim;
		this._password = options.password;

		this._browser = deps.browser;
		this._storage = deps.storage;
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
		await this._page.close();
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

		const ids = await this._page.getAttributesFromElements(this.LECTURE_URL, "href");
		const timestamp = Date.now();
		const tasks = ids.map(async (id) => {
			const page = await this._browser.newPage();
			await page.visit(this.createRedirectUrl(id));
			const html = await page.getContent({ sanitized: true });
			await this._storage.saveTo(`${timestamp}_${id}.html`, html);
		});
		await Promise.all(tasks);
	}

	private createRedirectUrl(id: string): string {
		const lmsSlcUrl = encodeURIComponent(`${this._lmsSlcUrl}/view.php?id=${id}`);
		const url = `${this._lmsUrl}?gotourl=${lmsSlcUrl}`;
		return url;
	}
}
