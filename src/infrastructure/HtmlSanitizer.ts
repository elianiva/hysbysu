import type { ISanitizer } from "~/domain/interfaces/ISanitizer";
import sanitize from "sanitize-html";

export class HtmlSanitizer implements ISanitizer {
	public sanitize(html: string): string {
		return sanitize(html).replace("\n", "");
	}
}
