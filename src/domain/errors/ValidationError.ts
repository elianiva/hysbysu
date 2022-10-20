export class ValidationError extends Error {
	constructor(name: string) {
		super(`${name} can't be empty!`);
	}
}
