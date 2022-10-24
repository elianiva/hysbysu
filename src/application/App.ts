import { detailedDiff } from "deep-object-diff";
import type { IStorage } from "~/domain/interfaces/IStorage";
import { Meeting } from "~/domain/Meeting";
import type { Scraper } from "~/domain/Scraper";
import { IS_DEV } from "~/env";
import type { IPresenter } from "./interfaces/IPresenter";
import type { DetailedDiff } from "./types/DetailedDiff";

export type AppDeps = {
	scraper: Scraper;
	presenter: IPresenter;
	storage: IStorage;
};

export class App {
	// 10 minutes on dev, 1 hour on any other env
	private readonly SCRAPE_INTERVAL = IS_DEV ? 10 * 1000 : 60 * 60 * 1000;
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
		const oldEntryName = entriesName.at(0);
		const newEntryName = entriesName.at(-1);

		const oldTimestamp = oldEntryName?.split("_").at(0);
		const newTimestamp = newEntryName?.split("_").at(0);

		if (oldTimestamp === undefined) throw new Error(`invalid entry name detected: ${oldEntryName}`);
		if (newTimestamp === undefined) throw new Error(`invalid entry name detected: ${newEntryName}`);

		// no new files
		// TODO(elianiva): figure out what to do, we don't want noop
		if (newTimestamp === oldTimestamp) return;

		const newEntries = entriesName.filter((name) => name.startsWith(newTimestamp));
		const oldEntries = entriesName.filter((name) => name.startsWith(oldTimestamp));

		const newFiles = await Promise.all(newEntries.map((name) => this._storage.get(name)));
		const oldFiles = await Promise.all(oldEntries.map((name) => this._storage.get(name)));

		if (newFiles.length !== oldFiles.length) throw new Error("old data and new data didn't match!");

		for (const [oldFileIndex, oldFile] of oldFiles.entries()) {
			const parsedOldFile = JSON.parse(oldFile);
			// use `oldFileIndex` here because we want to compare the matching new file with the old file
			const parsedNewFile = JSON.parse(newFiles[oldFileIndex]);

			for (const [oldSubjectIndex, oldSubjects] of parsedOldFile.entries()) {
				// also use `oldSubjectIndex` for the same reason as above
				const newSubjects = parsedNewFile[oldSubjectIndex];
				const diff = detailedDiff(oldSubjects, newSubjects) as DetailedDiff;
				console.log(diff);
				if (!this.isObjectEmpty(diff.added)) {
					const addedKeys = Object.keys(diff.added);
					const addedEntries = this.pickEntries<Record<string, any>>(oldSubjects, addedKeys);
					const meetings = addedEntries.map(
						(entry) =>
							new Meeting({
								lectures: entry?.["lectures"] ?? [],
								subject: entry?.["subject"] ?? "",
								title: entry?.["title"] ?? "",
							})
					);
					console.log(meetings);
				}

				// if (!this.isObjectEmpty(diff.updated)) {
				// 	this._presenter.notify(Object.values(diff.removed));
				// }
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

	private isObjectEmpty(obj: object) {
		return Object.keys(obj).length < 1;
	}

	private pickEntries<TEntry>(entries: TEntry[], indices: string[]): TEntry[] {
		return entries.filter((_, index) => indices.includes(index.toString()));
	}
}
