import { Hono } from "hono";
import { Subject } from "rxjs";
import { globalStore } from "~/store";
import { Env } from "~/types/env";

export class Router {
	private _app: Hono;
	private _rxSubject: Subject<string>;

	constructor(rxSubject: Subject<string>) {
		this._app = new Hono();
		this._rxSubject = rxSubject;
		this._bindRoutes();
		this._bindApiRoutes();
	}

	private _bindRoutes() {
		this._app.get("/", (c) => c.json({ message: "Nothing to see here." }));
		this._app.get("/_trigger", (c) => {
			this._rxSubject.next("");
			return c.json({ message: "Triggered the worker!" });
		});
	}

	private _bindApiRoutes() {
		const apiRoutes = new Hono();
		apiRoutes.get("/subjects", (c) => c.json({ subjects: globalStore.subjects }));
		apiRoutes.get("/_healthz", (c) => c.json({ message: "OK!" }));
		this._app.route("/api", apiRoutes);
	}

	public handle(request: Request, env: Env, ctx: ExecutionContext) {
		return this._app.fetch(request, env, ctx);
	}
}
