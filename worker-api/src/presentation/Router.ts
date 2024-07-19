import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Worker } from "~/application/Worker";
import type { ILogger } from "~/application/interfaces/ILogger";
import type { Env } from "~/env";

export class Router {
	#app: Hono;
	#logger: ILogger;
	#worker: Worker;

	constructor(worker: Worker, logger: ILogger) {
		this.#app = new Hono();
		this.#worker = worker;
		this.#logger = logger;
		this._bindRoutes();
		this._bindApiRoutes();
	}

	private _bindRoutes() {
		this.#app.get("/", (c) => c.json({ message: "Nothing to see here." }));
		this.#app.get("/_trigger", (c) => {
			try {
				void this.#worker.handle();
				return c.json({ message: "Triggered the worker!" });
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				this.#logger.error(message);
				return c.json({ message: "Failed to trigger the worker!" });
			}
		});
	}

	private _bindApiRoutes() {
		const apiRoutes = new Hono<{ Bindings: Env }>();
		apiRoutes.use("*", cors());
		// apiRoutes.get("/subjects", async (c) => {
		// 	const { keys } = await c.env.HYSBYSU_STORAGE.list({ prefix: "subject_" });
		// 	const subjects = await Promise.all(
		// 		keys.map((key) => c.env.HYSBYSU_STORAGE.get(key.name)),
		// 	);
		// 	return c.json({
		// 		subjects: subjects
		// 			.filter((subject): subject is string => subject !== null)
		// 			.map((subject) => JSON.parse(subject) as Subject[]),
		// 	});
		// });
		apiRoutes.get("/_healthz", (c) => c.json({ message: "OK!" }));

		this.#app.route("/api", apiRoutes);
	}

	public getApp() {
		return this.#app;
	}

	public handle(request: Request, env: Env, ctx: ExecutionContext) {
		return this.#app.fetch(request, env, ctx);
	}
}
