import type { IPage } from "./IPage";

export interface IBrowser {
	launch(): Promise<void>;
	newPage(): Promise<IPage>;
	getFirstPage(): Promise<IPage>;
	getPages(): Promise<IPage[]>;
	close(): Promise<void>;
}
