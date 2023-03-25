import { Hono } from "hono";
import { Subject } from "rxjs";
import { Env } from "~/types/env";

export class Router {
	#env: Env;
	#app: Hono;
	#rxSubject: Subject<string>;

	constructor(rxSubject: Subject<string>, env: Env) {
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
		apiRoutes.get("/subjects", async (c) => {
			const subjectsString = (await this.#env.HYSBYSU_STORAGE.get("subjects")) ?? "[]";
			return c.json({ subjects: JSON.parse(subjectsString) });
		});
		apiRoutes.get("/_healthz", (c) => c.json({ message: "OK!" }));
		this.#app.route("/api", apiRoutes);
	}

	public handle(request: Request, env: Env, ctx: ExecutionContext) {
		return this.#app.fetch(request, env, ctx);
	}
}
