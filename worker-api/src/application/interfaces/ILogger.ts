export interface ILogger {
	debug(text: string): void;
	info(text: string): void;
	error(text: string): void;
	warn(text: string): void;
}
