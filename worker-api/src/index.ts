import { Subject } from "rxjs";
import type { IWebhook } from "~/application/interfaces/IWebhook";
import { Webhook } from "~/presentation/Webhook";
import { HttpClient } from "./application/HttpClient";
import { Worker } from "./application/Worker";
import type { ICollector } from "./application/interfaces/ICollector";
import type { ILogger } from "./application/interfaces/ILogger";
import { Collector } from "./infrastructure/Collector";
import { ConsoleLogger } from "./infrastructure/ConsoleLogger";
import { CookieJar } from "./infrastructure/CookieJar";
import { NoopLogger } from "./infrastructure/NoopLogger";
import { Router } from "./presentation/Router";
import type { Env } from "./types/env";

type Dependency = {
	worker: Worker | null;
	httpClient: HttpClient | null;
	collector: ICollector | null;
	webhook: IWebhook | null;
	logger: ILogger | null;
};

// lazily initialise these dependencies because they need the environment bindings
const deps: Dependency = {
	worker: null,
	httpClient: null,
	collector: null,
	webhook: null,
	logger: null,
};

const rxSubject = new Subject<string>();

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
	scheduled: async (controller: ScheduledController, env: Env) => {
		deps.webhook ??= new Webhook(env);
		deps.logger ??=
			env.ENVIRONMENT === "production" ? new NoopLogger() : new ConsoleLogger();
		deps.httpClient ??= new HttpClient(env, deps.logger, cookieJar);
		deps.collector ??= new Collector(deps.httpClient, deps.logger);
		deps.worker ??= new Worker(
			deps.httpClient,
			env,
			deps.collector,
			deps.webhook,
			deps.logger,
		);

		// trigger each trigger differently to avoid cpu time limit
		switch (controller.cron) {
			case "*/10 * * * *":
				await deps.worker.handle({ slice: { start: 0, end: 3 } });
				break;
			case "*/11 * * * *":
				await deps.worker.handle({ slice: { start: 3, end: 6 } });
				break;
			case "*/12 * * * *":
				await deps.worker.handle({ slice: { start: 6, end: 8 } });
				break;
			default:
			//noop
		}
	},
	fetch: (request: Request, env: Env, ctx: ExecutionContext) => {
		return router.handle(request, env, ctx);
	},
};
