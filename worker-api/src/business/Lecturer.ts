import { ArgumentError } from "./exceptions/ArgumentError";

export class Lecturer {
	public name: string;
	public imageUrl: string;

	constructor(name: string, imageUrl: string) {
		if (name.length === 0) throw new ArgumentError("name");
		this.name = name;
		this.imageUrl = imageUrl;
	}
}
