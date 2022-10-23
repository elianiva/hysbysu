import type { IStorage } from "~/domain/interfaces/IStorage";
import type { Scraper } from "~/domain/Scraper";
import type { IPresenter } from "./interfaces/IPresenter";

export type AppDeps = {
	scraper: Scraper;
	presenter: IPresenter;
	storage: IStorage;
};

export class App {
	private readonly SCRAPE_INTERVAL = 60 * 60 * 1000; // 1 hour
	private readonly _scraper: AppDeps["scraper"];
	private readonly _presenter: AppDeps["presenter"];
	private readonly _storage: AppDeps["storage"];

	constructor(deps: AppDeps) {
		this._scraper = deps.scraper;
		this._presenter = deps.presenter;
		this._storage = deps.storage;
	}

	public async runScraper() {
		await this._scraper.init();
		while (true) {
			await this._scraper.scrape();
			await this.sendAll();
			await this.sleep(this.SCRAPE_INTERVAL);
		}
	}

	private async sendAll() {
		const entriesName = await this._storage.getAllEntriesName();
		const firstEntryName = entriesName.at(0);
		const oldEntryName = entriesName.at(-1);

		const firstTimestamp = firstEntryName?.split("_").at(0);
		const oldTimestamp = oldEntryName?.split("_").at(0);

		if (firstTimestamp === undefined) throw new Error(`invalid entry name detected: ${firstEntryName}`);
		if (oldTimestamp === undefined) throw new Error(`invalid entry name detected: ${oldEntryName}`);

		if (firstTimestamp === oldTimestamp) return;

		const currentTimeEntries = entriesName.filter((name) => name.startsWith(firstTimestamp));
		const oldEntries = entriesName.filter((name) => name.startsWith(oldTimestamp));
		const currentFiles = currentTimeEntries.map((name) => this._storage.get(name));
		const oldFiles = oldEntries.map((name) => this._storage.get(name));
		console.log({ currentFiles, oldFiles });
	}

	private async sleep(duration: number) {
		return new Promise((res) => setTimeout(() => res(undefined), duration));
	}
}
