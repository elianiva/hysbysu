export interface IPage {
	visit(url: string): Promise<void>;
	insert(key: string, value: string): Promise<void>;
	clickButton(selector: string, opts?: { useNativeClick: boolean }): Promise<void>;
	waitForNetworkIdle(): Promise<void>;
	close(): Promise<void>;
	getAttributesFromElements(selector: string, attributeName: string): Promise<string[]>;
	getContent(): Promise<string>;
}
