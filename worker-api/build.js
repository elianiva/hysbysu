import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
	await build({
		bundle: true,
		sourcemap: true,
		format: "esm",
		target: "esnext",
		external: ["ofetch"],
		conditions: ["worker", "browser"],
		entryPoints: [path.join(__dirname, "src", "index.ts")],
		outdir: path.join(__dirname, "dist"),
		outExtension: { ".js": ".mjs" },
		tsconfig: path.join(__dirname, "tsconfig.json"),
	});
} catch (err) {
	console.error(err);
	process.exitCode = 1;
}
