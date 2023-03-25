export type Cookie = {
	key: string;
	value: string;
	path: string;
	httpOnly: boolean;
	secure: boolean;
	sameSite: boolean;
};

export interface ICookieJar {
	entries(): Cookie[];
	get(name: string): Cookie | undefined;
	has(name: string): boolean;
	set(name: string, value: Cookie): void;
	parse(rawCookie: string): Cookie[];
	store(rawCookie: string): void;
}
