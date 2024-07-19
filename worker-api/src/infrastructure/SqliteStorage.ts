import sqlite3, { type Database } from "sqlite3";
import type { IStorage } from "~/application/interfaces/IStorage";

type Row = {
	key: string;
	value: string;
};

export class SqliteStorage implements IStorage {
	#db: Database;

	constructor(dbPath: string) {
		this.#db = new sqlite3.Database(dbPath);

		this.#db.run(`
			CREATE TABLE IF NOT EXISTS storage (
				key TEXT PRIMARY KEY,
				value TEXT
			);
		`);
	}

	async get(key: string): Promise<string | null> {
		const result: Row | null = await new Promise((resolve, reject) => {
			this.#db.get(
				"SELECT value FROM storage WHERE key = ?",
				key,
				(err, row: Row | undefined) => {
					if (err !== null) return reject(err);
					if (row === undefined) return resolve(null);
					resolve(row);
				},
			);
		});
		return result?.value ?? null;
	}

	async set(key: string, value: string): Promise<void> {
		this.#db.run(
			"INSERT OR REPLACE INTO storage (key, value) VALUES (?, ?)",
			key,
			value,
		);
	}
}
