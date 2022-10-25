import { APIEmbedField, AttachmentBuilder, Channel, Client, EmbedBuilder, TextChannel } from "discord.js";
import type { IPresenter } from "~/application/interfaces/IPresenter";
import type { Lecture } from "~/domain/Lecture";
import { MeetingUpdate, MeetingUpdateKind } from "~/domain/MeetingUpdate";
import { DISCORD_CHANNEL_ID } from "~/env";

export class DiscordPresenter implements IPresenter {
	private readonly _client: Client;

	constructor(client: Client) {
		this._client = client;
		client.user?.setActivity("Sedang mencari inpo");
		client.user?.setStatus("online");
	}

	public async notify(meeting: MeetingUpdate): Promise<void> {
		const channel = this._client.channels.cache.get(DISCORD_CHANNEL_ID) as TextChannel;
		if (channel === undefined) throw new Error("invalid discord channel id");

		const embed = this.createEmbed(meeting);
		await channel.send({ embeds: [embed] });
	}

	private createEmbed(meeting: MeetingUpdate) {
		const embed = new EmbedBuilder();
		embed.setThumbnail(
			"https://media.discordapp.net/attachments/1034341084735754260/1034370197429157888/unknown.png"
		);
		embed.setDescription("inpo gaes ada beban baru");

		if (meeting.kind === MeetingUpdateKind.NEW) {
			embed.setColor(0x61afef).setTitle("📚 New meeting has been added!");
		}
		if (meeting.kind === MeetingUpdateKind.EDITED) {
			embed.setColor(0xe5c07b).setTitle("📝 A meeting has been edited!");
		}

		const fields: APIEmbedField[] = [];
		fields.push({ name: "Title", value: meeting.title });
		fields.push({ name: "Subject", value: meeting.subject });

		const assignments = meeting.lectures.filter((lecture) => lecture.type === "assignment");
		if (assignments.length > 0) {
			fields.push({ name: "Assignments", value: this.buildLectureList(assignments) });
		}
		const resources = meeting.lectures.filter((lecture) => lecture.type === "resource");
		if (resources.length > 0) {
			fields.push({ name: "Resources", value: this.buildLectureList(resources) });
		}
		const quizzes = meeting.lectures.filter((lecture) => lecture.type === "quiz");
		if (quizzes.length > 0) {
			fields.push({ name: "Quizzes", value: this.buildLectureList(quizzes) });
		}
		const urls = meeting.lectures.filter((lecture) => lecture.type === "url");
		if (urls.length > 0) {
			fields.push({ name: "External Files", value: this.buildLectureList(urls) });
		}

		embed.addFields(fields);

		return embed;
	}

	private buildLectureList(lectures: Lecture[]): string {
		let message = "";
		for (const assignment of lectures) {
			message += `• [${assignment.name}](${assignment.url})\n`;
		}
		return message;
	}
}
