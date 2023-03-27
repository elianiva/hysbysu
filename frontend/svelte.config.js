import adapter from "@sveltejs/adapter-auto";
import path from "node:path";
import { vitePreprocess } from "@sveltejs/kit/vite";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		alias: {
			"~/*": path.resolve("./src"),
		},
	},
};

export default config;
