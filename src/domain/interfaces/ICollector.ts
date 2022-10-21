import type { Meeting } from "../Meeting";

export interface IMeetingCollector {
	collect(html: string): Meeting[];
}
