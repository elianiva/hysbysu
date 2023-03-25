import { Env } from "~/types/env";
import { HttpClient } from "./HttpClient";
import { ICollector } from "./interfaces/ICollector";
import { globalStore } from "~/store";

export class Worker {
	private _httpClient: HttpClient;
	#collector: ICollector;
	private _env: Env;

	constructor(httpClient: HttpClient, env: Env, collector: ICollector) {
		this._httpClient = httpClient;
		this._env = env;
		this.#collector = collector;
	}

	public async handle() {
		await this._httpClient.collectCookies();
		const subjectsContent = await this._httpClient.fetchSubjectsContent();
		const subjects = await this.#collector.collectSubjects(subjectsContent);
		globalStore.subjects = subjects;
	}
}
