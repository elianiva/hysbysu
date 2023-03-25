import { Subject } from "rxjs";
import { HttpClient } from "./application/HttpClient";
import { ICollector } from "./application/interfaces/ICollector";
import { ICookieJar } from "./application/interfaces/ICookieJar";
import { ILogger } from "./application/interfaces/ILogger";
import { Worker } from "./application/Worker";
import { ConsoleLogger } from "./infrastructure/ConsoleLogger";
import { CookieJar } from "./infrastructure/CookieJar";
import { Router } from "./presentation/Router";
import { Env } from "./types/env";
import { Collector } from "./infrastructure/Collector";

type Dependency = {
	router: Router | null;
	worker: Worker | null;
	httpClient: HttpClient | null;
	logger: ILogger | null;
	cookieJar: ICookieJar | null;
	collector: ICollector | null;
};

// lazily initialise dependencies
const deps: Dependency = {
	router: null,
	worker: null,
	httpClient: null,
	logger: null,
	cookieJar: null,
	collector: null,
};

const rxSubject = new Subject<string>();
rxSubject.subscribe(() => {
	console.log("Worker triggered from route");
	deps.worker?.handle();
});

export default {
	scheduled: (controller: ScheduledController, env: Env, ctx: ExecutionContext) => {
		deps.logger ??= new ConsoleLogger();
		deps.cookieJar ??= new CookieJar();
		deps.httpClient ??= new HttpClient(env, deps.logger, deps.cookieJar);
		deps.collector ??= new Collector(deps.httpClient);
		deps.worker ??= new Worker(deps.httpClient, env, deps.collector);

		return deps.worker.handle();
	},
	fetch: (request: Request, env: Env, ctx: ExecutionContext) => {
		deps.router ??= new Router(rxSubject);
		return deps.router.handle(request, env, ctx);
	},
};
