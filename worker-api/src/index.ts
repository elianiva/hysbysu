import { Subject } from "rxjs";
import { HttpClient } from "./application/HttpClient";
import { ICollector } from "./application/interfaces/ICollector";
import { Worker } from "./application/Worker";
import { ConsoleLogger } from "./infrastructure/ConsoleLogger";
import { CookieJar } from "./infrastructure/CookieJar";
import { Router } from "./presentation/Router";
import { Env } from "./types/env";
import { Collector } from "./infrastructure/Collector";
import { Webhook } from "~/presentation/Webhook";
import { IWebhook } from "~/application/interfaces/IWebhook";

type Dependency = {
	worker: Worker | null;
	httpClient: HttpClient | null;
	collector: ICollector | null;
	webhook: IWebhook | null;
};

// lazily initialise these dependencies because they need the environment bindings
const deps: Dependency = {
	worker: null,
	httpClient: null,
	collector: null,
	webhook: null,
};

const rxSubject = new Subject<string>();

const logger = new ConsoleLogger();
const cookieJar = new CookieJar();
const router = new Router(rxSubject);

rxSubject.subscribe(async () => {
	try {
		await deps.webhook?.info("fetching new LMS information");
		// TODO(elianiva): might want to fix this in the future
		// await deps.worker?.handle();
		await deps.webhook?.info("new LMS information successfully fetched");
	} catch (err) {
		await deps.webhook?.error("failed to fetch new LMS information");
	}
});

export default {
	scheduled: (controller: ScheduledController, env: Env) => {
		deps.webhook ??= new Webhook(env);
		deps.httpClient ??= new HttpClient(env, logger, cookieJar);
		deps.collector ??= new Collector(deps.httpClient, logger);
		deps.worker ??= new Worker(deps.httpClient, env, deps.collector, deps.webhook, logger);

		// trigger each trigger differently to avoid cpu time limit
		switch (controller.cron) {
			case "*/10 * * * *":
				deps.worker.handle({ slice: { start: 0, end: 4 } });
				break;
			case "*/11 * * * *":
				deps.worker.handle({ slice: { start: 4, end: 8 } });
				break;
			default:
			//noop
		}
	},
	fetch: (request: Request, env: Env, ctx: ExecutionContext) => {
		return router.handle(request, env, ctx);
	},
};
