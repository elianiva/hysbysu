import type { Scraper } from "~/domain/Scraper";

export class App {
	private readonly SCRAPE_INTERVAL = 60 * 60 * 1000; // 1 hour
	private readonly _scraper: Scraper;

	constructor(scraper: Scraper) {
		this._scraper = scraper;
	}

	public async runScraper() {
		await this._scraper.init();
		while (true) {
			await this._scraper.scrape();
			await this.sleep(this.SCRAPE_INTERVAL);
		}
	}

	private async sleep(duration: number) {
		return new Promise((res) => setTimeout(() => res(undefined), duration));
	}
}
