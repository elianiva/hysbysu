import { Env } from "~/types/env";
import { HttpClient } from "./HttpClient";
import { ICollector } from "./interfaces/ICollector";
import { Subject } from "~/business/Subject";
import { compareMeeting, Meeting } from "~/business/Meeting";
import { compareLecture, Lecture } from "~/business/Lecture";
import { IWebhook } from "~/application/interfaces/IWebhook";
import { ILogger } from "~/application/interfaces/ILogger";

export class Worker {
	#httpClient: HttpClient;
	#collector: ICollector;
	#env: Env;
	#webhook: IWebhook;
	#logger: ILogger;

	constructor(httpClient: HttpClient, env: Env, collector: ICollector, webhook: IWebhook, logger: ILogger) {
		this.#httpClient = httpClient;
		this.#env = env;
		this.#collector = collector;
		this.#webhook = webhook;
		this.#logger = logger;
	}

	#getMeetingsDiff(oldSubject: Subject, newSubject: Subject): Meeting[] {
		const oldLength = oldSubject.meetings.length;
		const newLength = newSubject.meetings.length;
		const result: Meeting[] = [];

		if (newLength > oldLength) {
			result.concat(newSubject.meetings.slice(oldLength));
		}

		const slicedMeetings = newSubject.meetings.slice(0, oldLength);
		for (let i = 0; i < slicedMeetings.length; i++) {
			const currentMeeting = slicedMeetings[i];
			const oldMeeting = oldSubject.meetings[i];
			const isEqual = compareMeeting(slicedMeetings[1], oldMeeting);
			const lecturesDiff = this.#getLecturesDiff(oldMeeting, currentMeeting);
			if (isEqual && lecturesDiff.length < 1) continue;
			result.push({ subject: currentMeeting.subject, title: currentMeeting.title, lectures: lecturesDiff });
		}

		return result;
	}

	#getLecturesDiff(oldMeeting: Meeting, newMeeting: Meeting): Lecture[] {
		const oldLength = oldMeeting.lectures.length;
		const newLength = oldMeeting.lectures.length;
		const result: Lecture[] = [];

		if (newLength > oldLength) {
			result.concat(newMeeting.lectures.slice(oldLength));
		}

		if (newLength === oldLength) {
			for (let i = 0; i < oldMeeting.lectures.length; i++) {
				const oldLecture = oldMeeting.lectures[i];
				const currentLecture = newMeeting.lectures[i];
				const isEqual = compareLecture(oldLecture, currentLecture);
				if (isEqual) continue;
				result.push(currentLecture);
			}
		}

		return result;
	}

	public async handle() {
		await this.#httpClient.collectCookies();
		const cachedSubjectsContent = await this.#env.HYSBYSU_STORAGE.get("subjects_content_cache");
		const subjectsContent = await this.#httpClient.fetchSubjectsContent();

		// just skip if there's no difference in the overall html
		if (cachedSubjectsContent === subjectsContent) return;

		const subjects = await this.#collector.collectSubjects(subjectsContent);
		const diffingTasks = subjects.map(async (subject) => {
			let oldSubjectString: string | null = null;
			try {
				oldSubjectString = await this.#env.HYSBYSU_STORAGE.get(`subject_${subject.courseId}`);
			} catch (err: unknown) {
				if (err instanceof Error) {
					this.#logger.error(err.message);
					await this.#webhook.error(
						`Failed to get old data for: ${subject.courseId}. Reason: ${err.message}`
					);
				}
			}
			if (oldSubjectString === null) return;

			const oldSubject = JSON.parse(oldSubjectString) as Subject;

			if (subject.meetings.length > 0 && oldSubject !== null && oldSubject.meetings.length > 0) {
				const meetingsDiff = this.#getMeetingsDiff(oldSubject, subject);
				if (meetingsDiff.length > 0) {
					await this.#webhook.notify({
						...subject,
						meetings: meetingsDiff,
					});
				}
			}

			try {
				await this.#env.HYSBYSU_STORAGE.put(`subject_${subject.courseId}`, JSON.stringify(subject));
			} catch (err: unknown) {
				if (err instanceof Error) {
					this.#logger.error(err.message);
					await this.#webhook.error(
						`Failed to save new data for: ${subject.courseId}. Reason: ${err.message}`
					);
				}
			}
		});

		try {
			await Promise.all(diffingTasks);
		} catch (err: unknown) {
			if (err instanceof Error) {
				this.#logger.error(err.message);
				await this.#webhook.error(err.message);
			}
		}
	}
}
