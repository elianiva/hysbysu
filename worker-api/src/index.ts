import { Subject } from "rxjs";
import { HttpClient } from "./application/HttpClient";
import { ICollector } from "./application/interfaces/ICollector";
import { Worker } from "./application/Worker";
import { ConsoleLogger } from "./infrastructure/ConsoleLogger";
import { CookieJar } from "./infrastructure/CookieJar";
import { Router } from "./presentation/Router";
import { Env } from "./types/env";
import { Collector } from "./infrastructure/Collector";
import { DiscordPresenter } from "~/infrastructure/DiscordPresenter";
import { IPresenter } from "~/application/interfaces/IPresenter";

type Dependency = {
	worker: Worker | null;
	httpClient: HttpClient | null;
	collector: ICollector | null;
	presenter: IPresenter | null;
};

// lazily initialise these dependencies because they need the environment bindings
const deps: Dependency = {
	worker: null,
	httpClient: null,
	collector: null,
	presenter: null,
};

const rxSubject = new Subject<string>();

const logger = new ConsoleLogger();
const cookieJar = new CookieJar();
const router = new Router(rxSubject);

rxSubject.subscribe(async () => {
	try {
		await deps.presenter?.info("fetching new LMS information");
		await deps.worker?.handle();
		await deps.presenter?.info("new LMS information successfully fetched");
	} catch (err) {
		await deps.presenter?.error("failed to fetch new LMS information");
	}
});

export default {
	scheduled: (controller: ScheduledController, env: Env) => {
		deps.httpClient ??= new HttpClient(env, logger, cookieJar);
		deps.collector ??= new Collector(deps.httpClient, logger);
		deps.worker ??= new Worker(deps.httpClient, env, deps.collector);
		return deps.worker.handle();
	},
	fetch: (request: Request, env: Env, ctx: ExecutionContext) => {
		return router.handle(request, env, ctx);
	},
};
