export interface IStorage {
	saveTo(filename: string, content: string): Promise<void>;
}
