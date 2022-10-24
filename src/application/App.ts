import type { IStorage } from "~/domain/interfaces/IStorage";
import type { Scraper } from "~/domain/Scraper";
import type { IPresenter } from "./interfaces/IPresenter";
import { detailedDiff } from "deep-object-diff";

export type AppDeps = {
	scraper: Scraper;
	presenter: IPresenter;
	storage: IStorage;
};

export class App {
	// private readonly SCRAPE_INTERVAL = 60 * 60 * 1000; // 1 hour
	private readonly SCRAPE_INTERVAL = 10 * 1000; // 1 hour
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
			await this.compareFiles();
			await this.sleep(this.SCRAPE_INTERVAL);
		}
	}

	private async compareFiles() {
		const entriesName = await this._storage.getAllEntriesName();
		const firstEntryName = entriesName.at(0);
		const oldEntryName = entriesName.at(-1);

		const firstTimestamp = firstEntryName?.split("_").at(0);
		const oldTimestamp = oldEntryName?.split("_").at(0);

		if (firstTimestamp === undefined) throw new Error(`invalid entry name detected: ${firstEntryName}`);
		if (oldTimestamp === undefined) throw new Error(`invalid entry name detected: ${oldEntryName}`);

		// no new files
		// TODO(elianiva): figure out what to do, we don't want noop
		console.log({ firstEntryName, oldTimestamp });
		if (firstTimestamp === oldTimestamp) return;

		const currentTimeEntries = entriesName.filter((name) => name.startsWith(firstTimestamp));
		const oldEntries = entriesName.filter((name) => name.startsWith(oldTimestamp));

		const currentFiles = await Promise.all(currentTimeEntries.map((name) => this._storage.get(name)));
		const oldFiles = await Promise.all(oldEntries.map((name) => this._storage.get(name)));

		if (currentFiles.length !== oldFiles.length) throw new Error("old data and new data didn't match!");

		for (const [index, file] of oldFiles.entries()) {
			for (const [index2, subject] of JSON.parse(file).entries()) {
				const diff = detailedDiff(subject, JSON.parse(currentFiles[index])[index2]);
				console.log(diff);
			}
		}

		// remove old files since we don't need them anymore after we get the diff
		for (const entry of oldEntries) {
			this._storage.remove(entry);
		}
	}

	private async sleep(duration: number) {
		return new Promise((res) => setTimeout(() => res(undefined), duration));
	}
}
