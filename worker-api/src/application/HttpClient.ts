import { FetchContext, type FetchOptions, Headers, ofetch } from "ofetch";
import type { ICookieJar } from "./interfaces/ICookieJar";
import type { ILogger } from "./interfaces/ILogger";
import type { Env } from "~/env";

export class HttpClient {
	#env: Env;
	#logger: ILogger;
	#cookieJar: ICookieJar;
	#hasMoodleSession = false;

	constructor(env: Env, logger: ILogger, cookieJar: ICookieJar) {
		this.#env = env;
		this.#logger = logger;
		this.#cookieJar = cookieJar;
	}

	private async collectSiakadCookies() {
		await this.fetch(this.#env.SIAKAD_URL, { method: "HEAD" });
	}

	private async collectHomepageCookies() {
		await this.fetch(`${this.#env.SIAKAD_URL}/beranda`, { method: "HEAD" });
	}

	private async collectSlcCookies() {
		// this needs to be done twice because for some reason
		// they decided to do this weird mechanism, i don't know why
		await this.fetch(this.#env.SLC_URL, { method: "HEAD" });
		await this.fetch(this.#env.SLC_URL, { method: "HEAD" });
	}

	private async login() {
		const formData = new FormData();
		formData.set("username", this.#env.NIM);
		formData.set("password", this.#env.PASSWORD);

		await this.postForm(`${this.#env.SIAKAD_URL}/login`, {
			body: formData,
		});
	}

	private async postForm(url: RequestInfo, options: FetchOptions = {}) {
		const headers = new Headers();
		headers.set("Accept", "application/json");
		headers.set("Referer", `${this.#env.SIAKAD_URL}/login/index/err/6`);
		headers.set("X-Requested-With", "XMLHttpRequest");
		return this.fetch(url, {
			...options,
			method: "POST",
			headers,
		});
	}

	private async fetch(
		url: RequestInfo,
		options: FetchOptions & {
			excludedCookies?: string[];
		} = {},
	) {
		// serialise the cookie
		const cookieString = this.#cookieJar
			.entries()
			.filter((cookie) => !options.excludedCookies?.includes(cookie.key))
			.map((cookie) => `${cookie.key}=${cookie.value}`)
			.join("; ");

		const headers = new Headers();
		headers.set("Cookie", cookieString);

		// merge headers if it's provided from the option
		if (options.headers !== undefined) {
			for (const [key, value] of (
				options.headers as Map<string, string>
			).entries()) {
				headers.set(key, value);
			}
		}

		// use chrome user agent by default
		headers.set(
			"User-Agent",
			"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
		);

		return ofetch(url, {
			...options,
			headers,
			onResponse: ({ response }) => {
				const cookies = response.headers.get("set-cookie");
				if (cookies === null) return;
				this.#cookieJar.store(response.headers.get("set-cookie") ?? "");
			},
		});
	}

	public async collectCookies() {
		try {
			this.#logger.info("collecting siakad cookies");
			await this.collectSiakadCookies();
			this.#logger.info("siakad cookies has been collected");
		} catch (err) {
			this.#logger.error("failed to collect siakad cookies");
			throw err;
		}

		try {
			this.#logger.info("attempting login");
			await this.login();
			this.#logger.info("successfully logged in");
		} catch (err) {
			this.#logger.error("failed to login");
			throw err;
		}

		try {
			this.#logger.info("collecting siakad homepage cookies");
			await this.collectHomepageCookies();
			this.#logger.info("siakad homepage cookie has been collected");
		} catch (err) {
			this.#logger.error("failed to collect siakad homepage cookie");
			throw err;
		}

		try {
			this.#logger.info("collecting slc cookies");
			await this.collectSlcCookies();
			this.#logger.info("slc cookie has been collected");
		} catch (err) {
			this.#logger.error("failed to collect slc cookie");
			throw err;
		}
	}

	public async fetchSubjectsContent() {
		const headers = new Headers();
		headers.set("Sec-Gpc", "1");
		headers.set("Sec-Fetch-Mode", "cors");
		headers.set("Sec-Fetch-Site", "same-origin");
		headers.set("Sec-Fetch-Dest", "empty");
		headers.set("Referer", `${this.#env.SLC_URL}/spada`);
		headers.set("Host", this.#env.SLC_URL);
		headers.set("Pragma", "no-cache");
		const response: string = await this.fetch(`${this.#env.SLC_URL}`, {
			parseResponse: (text) => text,
			headers,
		});
		return response;
	}

	public async fetchLmsContent(courseUrl: string) {
		// the first firstResponse, which has a url format of `slcUrl/spada/?gotourl=xxx` is used to get the cookie needed for the lms page itself
		// the firstResponse is a <script>window.location="<lmsUrl>"</script>, which we do in the second request
		// not sure why they use client side redirect instead of responding with 302 status code
		await this.fetch(
			`${this.#env.SLC_URL}/spada?gotourl=${encodeURIComponent(courseUrl)}`,
		);
		if (!this.#hasMoodleSession) {
			const headers = new Headers();
			headers.set("Sec-Fetch-Site", "same-site");
			headers.set("Referer", this.#env.SLC_URL);
			await this.fetch(courseUrl, { headers });

			// we can't simply do `h.hasMoodleSession = true` after fetching
			// because we can't be sure if it's succeeded or not
			if (this.#cookieJar.has("MoodleSession")) {
				this.#hasMoodleSession = true;
			}
		}

		return await this.fetch(courseUrl, { parseResponse: (text) => text });
	}

	public async fetchAssignmentContent(assignmentUrl: string) {
		const headers = new Headers();
		headers.set("Sec-Fetch-Site", "same-site");
		headers.set("Referer", assignmentUrl);
		await this.fetch(assignmentUrl, { headers });

		return await this.fetch(assignmentUrl, { parseResponse: (text) => text });
	}
}
