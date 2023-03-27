/** @type {import("prettier").Config} */
module.exports = {
	useTabs: true,
	tabWidth: 4,
	singleQuote: false,
	trailingComma: "all",
	printWidth: 120,
	arrowParens: "always",
	plugins: ["./node_modules/prettier-plugin-svelte"],
	pluginSearchDirs: ["."],
	overrides: [
		{
			files: "*.svelte",
			options: {
				parser: "svelte",
			},
		},
	],
};
