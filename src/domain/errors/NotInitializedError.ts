export class NotInitializedError extends Error {
	constructor(name: string) {
		super(`${name} was not initialised properly!`);
	}
}
