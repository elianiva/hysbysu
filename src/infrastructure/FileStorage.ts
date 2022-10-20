import { mkdir, stat, writeFile } from "fs/promises";
import path from "path";
import type { IStorage } from "~/domain/interfaces/IStorage";

export class FileStorage implements IStorage {
	private readonly _basePath: string;
	private readonly _snapshotDir: string;

	constructor(snapshotDir?: string) {
		this._basePath = process.cwd();
		this._snapshotDir = path.join(this._basePath, snapshotDir ?? "snapshots");
	}

	public async saveTo(filename: string, content: string): Promise<void> {
		await this.prepareDirectory();
		await writeFile(path.join(this._snapshotDir, filename), content);
	}

	private async prepareDirectory() {
		const isDirectoryExists = (await stat(this._snapshotDir)) !== undefined;
		if (isDirectoryExists) return;
		await mkdir(this._snapshotDir);
	}
}
