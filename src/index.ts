import { launch } from "puppeteer";
import { BOT_TOKEN, IS_DEV, LMS_URL, NIM, PASSWORD, SIAKAD_URL } from "./env";
import { Scraper } from "./domain/Scraper";
import { PuppeteerBrowser } from "./infrastructure/PuppeteerBrowser";
import { FileStorage } from "./infrastructure/FileStorage";
import { App } from "./application/App";
import { CheerioCollector } from "./infrastructure/CheerioCollector";
import { Bot } from "grammy";
import { TelegramPresenter } from "./presentation/TelegramPresenter";

const browserInstance = await launch({
	headless: !IS_DEV,
	args: ["--no-sandbox", "--disable-gpu"],
});

const fileStorage = new FileStorage();
const cheerioCollector = new CheerioCollector();
const puppeteerBrowser = new PuppeteerBrowser(browserInstance);
const scraper = new Scraper(
	{
		siakadUrl: SIAKAD_URL,
		lmsUrl: LMS_URL,
		nim: NIM,
		password: PASSWORD,
	},
	{
		browser: puppeteerBrowser,
		storage: fileStorage,
		collector: cheerioCollector,
	}
);
const bot = new Bot(BOT_TOKEN);
const telegramPresenter = new TelegramPresenter(bot);

const app = new App({
	scraper: scraper,
	presenter: telegramPresenter,
	storage: fileStorage,
});

await app.runScraper();
