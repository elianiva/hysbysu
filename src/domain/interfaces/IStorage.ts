export interface IStorage {
	put(key: string, value: string): Promise<void>;
	get(key: string): Promise<string>;
	remove(key: string): Promise<void>;
	getAllEntriesName(): Promise<string[]>;
}
