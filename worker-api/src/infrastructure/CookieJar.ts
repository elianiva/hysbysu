import { Cookie, ICookieJar } from "~/application/interfaces/ICookieJar";

export class CookieJar implements ICookieJar {
	private _storage = new Map<string, Cookie>();

	public entries() {
		return [...this._storage.entries()].map(([_, cookie]) => cookie);
	}

	public get(name: string) {
		return this._storage.get(name);
	}

	public has(name: string) {
		return this._storage.has(name);
	}

	public set(name: string, value: Cookie) {
		this._storage.set(name, value);
	}

	public store(rawCookie: string): void {
		const cookies = this.parse(rawCookie);
		for (const cookie of cookies) {
			this._storage.set(cookie.key, cookie);
		}
	}

	public parse(rawCookie: string): Cookie[] {
		// need a lookahead operator to check if the next character is a letter or not
		// because there can be an ExpiresIn property which will break if we use `, `
		const cookieStrings = rawCookie.split(/, (?=[a-zA-Z])/);
		return cookieStrings.map((cookie) => {
			const kvPairs = cookie.split(";").map((kvPair) => kvPair.split("=").map((s) => s.trim()));
			const [key, value] = kvPairs[0];
			const properties = Object.fromEntries(kvPairs.slice(1));
			return {
				key,
				value,
				httpOnly: properties["HttpOnly"] !== undefined,
				path: properties["Path"],
				sameSite: properties["SameSite"],
				secure: properties["Secure"] !== undefined,
			};
		});
	}
}
