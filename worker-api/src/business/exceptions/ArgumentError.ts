export class ArgumentError extends Error {
	constructor(name = "<empty>") {
		super(`Argument ${name} was invalid.`);
		this.name = "ArgumentError";
	}
}
