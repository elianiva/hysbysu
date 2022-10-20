import { launch } from "puppeteer";
import { IS_DEV, LMS_SLC_URL, LMS_URL, NIM, PASSWORD, SIAKAD_URL } from "./env";
import { Scraper } from "./domain/Scraper";
import { HtmlSanitizer } from "./infrastructure/HtmlSanitizer";
import { PuppeteerBrowser } from "./infrastructure/PuppeteerBrowser";
import { FileStorage } from "./infrastructure/FileStorage";
import { App } from "./application/App";

const browserInstance = await launch({
	headless: !IS_DEV,
	args: ["--no-sandbox", "--disable-gpu"],
});

const sanitizer = new HtmlSanitizer();
const puppeteerBrowser = new PuppeteerBrowser(browserInstance, sanitizer);
const fileStorage = new FileStorage();

const scraper = new Scraper(
	{
		siakadUrl: SIAKAD_URL,
		lmsUrl: LMS_URL,
		lmsSlcUrl: LMS_SLC_URL,
		nim: NIM,
		password: PASSWORD,
	},
	{
		browser: puppeteerBrowser,
		storage: fileStorage,
	}
);

const app = new App(scraper);

await app.runScraper();
