import { Router } from "./presentation/Router";
import { serve } from "@hono/node-server";
import { Worker } from "~/application/Worker";
import { HttpClient } from "~/application/HttpClient";
import { Collector } from "~/infrastructure/Collector";
import { ConsoleLogger } from "~/infrastructure/ConsoleLogger";
import { env } from "~/env";
import { CookieJar } from "~/infrastructure/CookieJar";
import { SqliteStorage } from "~/infrastructure/SqliteStorage";
import path from "node:path";
import { TelegramWebhook } from "~/presentation/TelegramWebhook";

const fullStoragePath = path.resolve(env.STORAGE_PATH);
const storage = new SqliteStorage(fullStoragePath);
const logger = new ConsoleLogger();
const cookieJar = new CookieJar();
const httpClient = new HttpClient(env, logger, cookieJar);
const collector = new Collector(httpClient, logger);
const webhook = new TelegramWebhook(env);

const worker = new Worker(httpClient, env, collector, webhook, logger, storage);
const router = new Router(worker, logger);
const app = router.getApp();
const port = Number.parseInt(process.env.PORT ?? "8080");

console.log(`Starting server at ${port}...`);

serve({
	fetch: app.fetch,
	port,
});
