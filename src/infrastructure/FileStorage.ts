import { mkdir, stat, writeFile, readFile, readdir } from "fs/promises";
import path from "path";
import type { IStorage } from "~/domain/interfaces/IStorage";

export class FileStorage implements IStorage {
	private readonly _basePath: string;
	private readonly _snapshotDir: string;

	constructor(snapshotDir?: string) {
		this._basePath = process.cwd();
		this._snapshotDir = path.join(this._basePath, snapshotDir ?? "snapshots");
	}

	public async getAllEntriesName(): Promise<string[]> {
		const files = await readdir(this._snapshotDir);
		return files;
	}

	public async put(key: string, value: string): Promise<void> {
		await this.prepareDirectory();
		await writeFile(path.join(this._snapshotDir, key), value);
	}

	public async get(key: string): Promise<string> {
		const file = await readFile(path.join(this._snapshotDir, key));
		return file.toString();
	}

	private async prepareDirectory() {
		const isDirectoryExists = (await stat(this._snapshotDir)) !== undefined;
		if (isDirectoryExists) return;
		await mkdir(this._snapshotDir);
	}
}
