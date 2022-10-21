import type { Page } from "puppeteer";
import type { IPage } from "~/domain/interfaces/IPage";

/**
 * A wrapper around Puppeteer's Page class which automatically disables images, css, and fonts from loading.
 */
export class PuppeteerPage implements IPage {
	private readonly _page: Page;

	constructor(page: Page) {
		this._page = page;
		this.attachInterceptor(this._page);
		// TODO: remove
		this._page.setDefaultTimeout(120000);
	}

	public async getContent(): Promise<string> {
		const rawContent = await this._page.content();
		return rawContent;
	}

	public async getAttributesFromElements(selector: string, attributeName: string): Promise<string[]> {
		await this._page.waitForFunction((s) => !!document.querySelectorAll(s), {}, selector);
		const classIds = await this._page.$$eval(
			selector,
			(elements, name) => elements.map((el) => el.getAttribute(name)),
			attributeName
		);
		return classIds?.filter((id): id is string => id !== undefined) ?? [];
	}

	public async waitForNetworkIdle(): Promise<void> {
		await this._page.waitForNavigation({ waitUntil: "networkidle0" });
	}

	/**
	 * Shortcut for `waitForSelector` and `click`
	 * @param selector Element you want to click
	 * @param opts.useNativeClick When enabled, use native Javascript click event instead of puppeteer click (default to false)
	 */
	public async clickButton(selector: string, opts?: { useNativeClick: boolean }): Promise<void> {
		await this._page.waitForSelector(selector);
		if (!opts?.useNativeClick) {
			await this._page.click(selector);
			return;
		}
		const element = await this._page.$(selector);
		await element?.evaluate((el) => (el as HTMLDivElement).click());
	}

	public async insert(key: string, value: string): Promise<void> {
		await this._page.waitForSelector(key);
		await this._page.click(key);
		await this._page.keyboard.type(value);
	}

	/**
	 * Visit the webpage from the given url
	 * @param url Url you want to visit
	 */
	public async visit(url: string): Promise<void> {
		await this._page.goto(url);
	}

	/**
	 * Close the page
	 */
	public async close(): Promise<void> {
		await this._page.close();
	}

	/**
	 * Attach an interceptor which blocks images and css assets
	 * @param page An active page instance
	 */
	private attachInterceptor(page: Page) {
		page.setRequestInterception(true);
		page.on("request", (request) => {
			const url = request.url();
			const resourceType = request.resourceType();

			// block icons, images, fonts, and css
			if (
				url.endsWith(".svg") ||
				url.endsWith(".woff2") ||
				resourceType === "image" ||
				resourceType === "stylesheet" ||
				resourceType === "font"
			) {
				request.abort();
			} else {
				request.continue();
			}
		});
	}
}
