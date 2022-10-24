import { ValidationError } from "./errors/ValidationError";
import { Meeting, type MeetingOption } from "./Meeting";

export enum MeetingUpdateKind {
	NEW = "New",
	EDITED = "Edited",
	REMOVED = "Removed",
}

type MeetingUpdateOption = {
	kind: MeetingUpdateKind;
} & MeetingOption;

export class MeetingUpdate extends Meeting {
	public readonly kind: MeetingUpdateOption["kind"];

	constructor(opts: MeetingUpdateOption) {
		super(opts);

		if (opts.kind === undefined) throw new ValidationError("kind");

		this.kind = opts.kind;
	}
}
