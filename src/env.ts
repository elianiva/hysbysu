const NODE_ENV = process.env.NODE_ENV ?? "development"; // dev by default

export const IS_DEV = NODE_ENV === "development";
export const SCRAPE_INTERVAL = process.env.SCRAPE_INTERVAL ?? "";
export const NIM = process.env.NIM ?? "";
export const PASSWORD = process.env.PASSWORD ?? "";
export const SIAKAD_URL = process.env.SIAKAD_URL ?? "";
export const LMS_URL = process.env.LMS_URL ?? "";
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
export const TELEGRAM_USER_ID = process.env.TELEGRAM_USER_ID ?? "";
export const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN ?? "";
export const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID ?? "";
export const CHROME_BIN = process.env.CHROME_BIN ?? "";
