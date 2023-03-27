import { Hono } from "hono";
import { cors } from "hono/cors";
import { Subject as RxSubject } from "rxjs";
import { Subject } from "~/business/Subject";
import { Env } from "~/types/env";

export class Router {
	#env: Env;
	#app: Hono;
	#rxSubject: RxSubject<string>;

	constructor(rxSubject: RxSubject<string>, env: Env) {
		this.#app = new Hono();
		this.#rxSubject = rxSubject;
		this.#env = env;
		this._bindRoutes();
		this._bindApiRoutes();
	}

	private _bindRoutes() {
		this.#app.get("/", (c) => c.json({ message: "Nothing to see here." }));
		this.#app.get("/_trigger", (c) => {
			this.#rxSubject.next("");
			return c.json({ message: "Triggered the worker!" });
		});
	}

	private _bindApiRoutes() {
		const apiRoutes = new Hono();
		apiRoutes.use("*", cors());
		apiRoutes.get("/subjects", async (c) => {
			const { keys } = await this.#env.HYSBYSU_STORAGE.list({ prefix: "subject_" });
			const subjects = await Promise.all(keys.map((key) => this.#env.HYSBYSU_STORAGE.get(key.name)));
			return c.json({
				subjects: subjects
					.filter((subject): subject is string => subject !== null)
					.map((subject) => JSON.parse(subject) as Subject[]),
			});
		});
		apiRoutes.get("/_healthz", (c) => c.json({ message: "OK!" }));

		this.#app.route("/api", apiRoutes);
	}

	public handle(request: Request, env: Env, ctx: ExecutionContext) {
		return this.#app.fetch(request, env, ctx);
	}
}
