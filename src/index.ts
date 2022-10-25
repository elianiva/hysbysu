import { DISCORD_BOT_TOKEN, LMS_URL, NIM, PASSWORD, SIAKAD_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_USER_ID } from "./env";
import { Scraper } from "./domain/Scraper";
import { PuppeteerBrowser } from "./infrastructure/PuppeteerBrowser";
import { FileStorage } from "./infrastructure/FileStorage";
import { App } from "./application/App";
import { CheerioCollector } from "./infrastructure/CheerioCollector";
import { DummyPresenter } from "./presentation/DummyPresenter";
import { Hub } from "./presentation/Hub";
import { TelegramPresenter } from "./presentation/TelegramPresenter";
import { Bot } from "grammy";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { DiscordPresenter } from "./presentation/DiscordPresenter";

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

const hub = new Hub();
hub.addPresenter(new DummyPresenter());

const bot = new Bot(TELEGRAM_BOT_TOKEN);
hub.addPresenter(new TelegramPresenter(bot, TELEGRAM_USER_ID));

const discordClient = new Client({ intents: [GatewayIntentBits.Guilds] });
discordClient.login(DISCORD_BOT_TOKEN);
discordClient.on(Events.ClientReady, () => console.info("Discord client is ready!"));
hub.addPresenter(new DiscordPresenter(discordClient));

const app = new App({
	scraper: scraper,
	storage: fileStorage,
	hub: hub,
});

await app.runScraper();
