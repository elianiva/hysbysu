import { IPresenter } from "~/application/interfaces/IPresenter";
import {
	Client,
	EmbedBuilder,
	Events,
	GatewayIntentBits,
	Interaction,
	SlashCommandBuilder,
	TextChannel,
} from "discord.js";
import { ILogger } from "~/application/interfaces/ILogger";
import { Env } from "~/types/env";
import { Subject } from "~/business/Subject";
import { Lecture, LECTURE_TYPE, LectureType } from "~/business/Lecture";

export class DiscordPresenter implements IPresenter {
	#env: Env;
	#client: Client;
	#logger: ILogger;
	#channel: TextChannel | null = null;

	constructor(logger: ILogger, env: Env) {
		this.#logger = logger;
		this.#env = env;
		this.#client = new Client({ intents: [GatewayIntentBits.Guilds] });

		this.#bindEvents();
		void this.#client.login(env.DISCORD_TOKEN);
	}

	#bindEvents() {
		this.#client.on(Events.ClientReady, (c) => {
			this.#logger.info("Discord presenter ready");
			this.#channel = c.channels.cache.get(this.#env.DISCORD_CHANNEL_ID) as TextChannel;
		});
	}

	public async error(message: string): Promise<void> {
		return Promise.resolve(undefined);
	}

	public async notify(subject: Subject): Promise<void> {
		const notifyTasks = subject.meetings.map(async (meeting) => {
			const embed = new EmbedBuilder()
				.setTitle("📚 Inpo tugas!!")
				.setAuthor({
					name: subject.lecturer.name,
					url: "https://twirpz.files.wordpress.com/2015/06/twitter-avi-gender-balanced-figure.png",
				})
				.setColor("#61afef")
				.setFields([
					{ name: "Title", value: meeting.title },
					{ name: "Subject", value: subject.title },
				])
				.setThumbnail(
					"https://media.discordapp.net/attachments/1034341084735754260/1034370197429157888/unknown.png"
				)
				.setTimestamp()
				.setFooter({ text: "kalo ada tugas buru dikerjain, gausah ditunda tunda" });

			const assignments = this.#buildLectureList(meeting.lectures, LECTURE_TYPE.assignment);
			if (assignments.length > 0) {
				embed.addFields({ name: "Assignments", value: assignments });
			}

			const resources = this.#buildLectureList(meeting.lectures, LECTURE_TYPE.resource);
			if (resources.length > 0) {
				embed.addFields({ name: "Resources", value: resources });
			}

			const quizzes = this.#buildLectureList(meeting.lectures, LECTURE_TYPE.quiz);
			if (quizzes.length > 0) {
				embed.addFields({ name: "Quizzes", value: quizzes });
			}

			const externalResources = this.#buildLectureList(meeting.lectures, LECTURE_TYPE.url);
			if (externalResources.length > 0) {
				embed.addFields({ name: "External Resources", value: externalResources });
			}

			const pages = this.#buildLectureList(meeting.lectures, LECTURE_TYPE.page);
			if (pages.length > 0) {
				embed.addFields({ name: "Pages", value: pages });
			}

			const uncategorised = this.#buildLectureList(meeting.lectures, LECTURE_TYPE.unknown);
			if (uncategorised.length > 0) {
				embed.addFields({ name: "Uncategorised", value: uncategorised });
			}

			await this.#channel?.send({ embeds: [embed] });
		});
		await Promise.all(notifyTasks);
	}

	#buildLectureList(lectures: Lecture[], lectureType: LectureType): string {
		return lectures
			.filter((lecture) => lecture.type === lectureType)
			.map((lecture) => `• [${lecture.name}](${lecture.url})`)
			.join("\n");
	}

	public async healthCheck(): Promise<void> {
		await this.#channel?.send("I'm alive!");
	}

	public async info(message: string): Promise<void> {
		await this.#channel?.send(message);
	}
}
