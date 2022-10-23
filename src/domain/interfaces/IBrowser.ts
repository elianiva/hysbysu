import type { IPage } from "./IPage";

export interface IBrowser {
	newPage(): Promise<IPage>;
	getFirstPage(): Promise<IPage>;
	getPages(): Promise<IPage[]>;
}
