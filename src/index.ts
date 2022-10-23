import { launch } from "puppeteer";
import { IS_DEV, LMS_URL, NIM, PASSWORD, SIAKAD_URL } from "./env";
import { Scraper } from "./domain/Scraper";
import { PuppeteerBrowser } from "./infrastructure/PuppeteerBrowser";
import { FileStorage } from "./infrastructure/FileStorage";
import { App } from "./application/App";
import { CheerioCollector } from "./infrastructure/CheerioCollector";
import { DummyPresenter } from "./presentation/DummyPresenter";

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
const dummyPresenter = new DummyPresenter();

const app = new App({
	scraper: scraper,
	presenter: dummyPresenter,
	storage: fileStorage,
});

await app.runScraper();
