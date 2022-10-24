import { mkdir, stat, writeFile, readFile, readdir, rm } from "fs/promises";
import path from "path";
import type { IStorage } from "~/domain/interfaces/IStorage";

export class FileStorage implements IStorage {
	private readonly _basePath: string;
	private readonly _snapshotDir: string;

	constructor(snapshotDir?: string) {
		this._basePath = process.cwd();
		this._snapshotDir = path.join(this._basePath, snapshotDir ?? "snapshots");
	}

	/**
	 * Get a list of entries name in a chronological order
	 */
	public async getAllEntriesName(): Promise<string[]> {
		const files = await readdir(this._snapshotDir);
		return files.filter((file) => !file.startsWith(".")).sort();
	}

	public async put(key: string, value: string): Promise<void> {
		await this.prepareDirectory();
		await writeFile(path.join(this._snapshotDir, key), value);
	}

	public async get(key: string): Promise<string> {
		const file = await readFile(path.join(this._snapshotDir, key));
		return file.toString();
	}

	public async remove(key: string): Promise<void> {
		await rm(path.join(this._snapshotDir, key));
	}

	private async prepareDirectory() {
		const isDirectoryExists = (await stat(this._snapshotDir)) !== undefined;
		if (isDirectoryExists) return;
		await mkdir(this._snapshotDir);
	}
}
