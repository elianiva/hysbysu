import * as diff from "diff";
import { readFile } from "fs/promises";

console.log("reading file...");
const oldFile = await readFile("./snapshots/1666276113332_5235.html");
const newFile = await readFile("./snapshots/somethingtest.html");
console.log("finished reading file...");

console.log("diffing...");
const diffResult = diff.diffChars(oldFile.toString(), newFile.toString());
console.log("finished diffing...");

diffResult.forEach((part) => {
	if (part.removed) {
		process.stdout.write(part.value + "\n");
	}
});
