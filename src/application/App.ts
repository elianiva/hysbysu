import deepDiff, { DiffArray, DiffNew } from "deep-diff";
import type { ILogger } from "~/domain/interfaces/ILogger";
import type { IStorage } from "~/domain/interfaces/IStorage";
import type { Lecture } from "~/domain/Lecture";
import type { Meeting } from "~/domain/Meeting";
import { MeetingUpdate, MeetingUpdateKind } from "~/domain/MeetingUpdate";
import type { Scraper } from "~/domain/Scraper";
import { IS_DEV, SCRAPE_INTERVAL } from "~/env";
import type { IHub } from "./interfaces/IHub";

export type AppDeps = {
	scraper: Scraper;
	storage: IStorage;
	hub: IHub;
	logger: ILogger;
};

export class App {
	private readonly _scraper: AppDeps["scraper"];
	private readonly _storage: AppDeps["storage"];
	private readonly _hub: AppDeps["hub"];
	private readonly _logger: AppDeps["logger"];

	constructor(deps: AppDeps) {
		this._scraper = deps.scraper;
		this._hub = deps.hub;
		this._storage = deps.storage;
		this._logger = deps.logger;
	}

	public async runScraper() {
		await this._scraper.init();
		while (true) {
			try {
				this._logger.info("Scraping...");
				await this._scraper.scrape();
				this._logger.info("Comparing files...");
				await this.compareFiles();
				this._logger.info("Scraping done!");
				await new Promise((res) => setTimeout(() => res(undefined), IS_DEV ? 10 * 1000 : SCRAPE_INTERVAL));
			} catch (err) {
				if (err instanceof Error) {
					this._logger.error(err.message);
				} else {
					this._logger.error("Unknown error.")
				}
				throw err
			}
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

		this._logger.info("Comparing entries");
		const updates = this.getMeetingUpdates(oldFiles, newFiles);
		for (const update of updates) {
			this._hub.emit(update);
		}

		// remove old files since we don't need them anymore after we get the diff
		for (const entry of oldEntries) {
			this._storage.remove(entry);
		}
	}

	private getMeetingUpdates(oldFiles: string[], newFiles: string[]) {
		const updates: MeetingUpdate[] = [];

		for (const [oldFileIndex, oldFile] of oldFiles.entries()) {
			const parsedOldFile = JSON.parse(oldFile) as Meeting[];
			// use `oldFileIndex` here because we want to compare the matching new file with the old file
			const parsedNewFile = JSON.parse(newFiles[oldFileIndex]) as Meeting[];

			const diffItems = deepDiff.diff(parsedOldFile, parsedNewFile);
			if (diffItems === undefined) continue;

			const listUpdates = diffItems.filter((diff): diff is DiffArray<any, any> => diff.kind === "A");

			const meetingUpdates = listUpdates.filter(
				(update) => update.path === undefined && update.item.kind === "N"
			);
			for (const meetingDiff of meetingUpdates) {
				const meetingItem = meetingDiff.item as DiffNew<any>;
				updates.push(
					new MeetingUpdate({
						title: meetingItem.rhs.title,
						subject: meetingItem.rhs.subject,
						lectures: meetingItem.rhs.lectures,
						kind: MeetingUpdateKind.NEW,
					})
				);
			}

			// group lecture updates that has a same parents
			const lectureUpdates = listUpdates.reduce((acc, curr) => {
				// should be impossible but who knows
				// I couldn't get the typing right
				if (curr.path === undefined) return acc;

				const meetingIndex = curr.path[0];
				if (curr.path !== undefined) {
					const lectures = acc.get(meetingIndex) ?? [];
					const updatedLectures = lectures.concat((curr.item as DiffNew<any>).rhs);
					acc.set(meetingIndex, updatedLectures);
				}
				return acc;
			}, new Map<number, Lecture[]>());

			for (const [meetingIndex, newLectures] of lectureUpdates.entries()) {
				const meeting = parsedNewFile[meetingIndex];
				updates.push(
					new MeetingUpdate({
						title: meeting.title,
						subject: meeting.subject,
						lectures: newLectures,
						kind: MeetingUpdateKind.EDITED,
					})
				);
			}
		}

		return updates;
	}
}
