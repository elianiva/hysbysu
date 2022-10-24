import { LMS_URL, NIM, PASSWORD, SIAKAD_URL } from "./env";
import { Scraper } from "./domain/Scraper";
import { PuppeteerBrowser } from "./infrastructure/PuppeteerBrowser";
import { FileStorage } from "./infrastructure/FileStorage";
import { App } from "./application/App";
import { CheerioCollector } from "./infrastructure/CheerioCollector";
import { DummyPresenter } from "./presentation/DummyPresenter";

const fileStorage = new FileStorage();
const cheerioCollector = new CheerioCollector();
const puppeteerBrowser = new PuppeteerBrowser();
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
