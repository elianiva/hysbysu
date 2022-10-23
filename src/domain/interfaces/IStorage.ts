export interface IStorage {
	put(key: string, value: string): Promise<void>;
	get(key: string): Promise<string>;
	getAllEntriesName(): Promise<string[]>;
}
