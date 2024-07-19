import type { ILogger } from "~/application/interfaces/ILogger";
import type { IWebhook } from "~/application/interfaces/IWebhook";
import { type Lecture, compareLecture } from "~/business/Lecture";
import { type Meeting, compareMeeting } from "~/business/Meeting";
import type { Subject } from "~/business/Subject";
import type { HttpClient } from "./HttpClient";
import type { ICollector } from "./interfaces/ICollector";
import type { Env } from "~/env";
import type { IStorage } from "~/application/interfaces/IStorage";
import { wrapPromiseResult } from "~/utils/promise";

export class Worker {
	#httpClient: HttpClient;
	#collector: ICollector;
	#env: Env;
	#webhook: IWebhook;
	#logger: ILogger;
	#storage: IStorage;

	constructor(
		httpClient: HttpClient,
		env: Env,
		collector: ICollector,
		webhook: IWebhook,
		logger: ILogger,
		storage: IStorage,
	) {
		this.#httpClient = httpClient;
		this.#env = env;
		this.#collector = collector;
		this.#webhook = webhook;
		this.#logger = logger;
		this.#storage = storage;
	}

	#getMeetingsDiff(oldSubject: Subject, newSubject: Subject): Meeting[] {
		const oldLength = oldSubject.meetings.length;
		const newLength = newSubject.meetings.length;
		let result: Meeting[] = [];

		if (newLength > oldLength) {
			result = result.concat(newSubject.meetings.slice(oldLength));
		}

		const slicedMeetings = newSubject.meetings.slice(0, oldLength);
		for (let i = 0; i < slicedMeetings.length; i++) {
			const newMeeting = slicedMeetings[i];
			const oldMeeting = oldSubject.meetings[i];
			const isEqual = compareMeeting(newMeeting, oldMeeting);
			const lecturesDiff = this.#getLecturesDiff(oldMeeting, newMeeting);
			if (isEqual && lecturesDiff.length < 1) continue;
			result.push({
				subject: newMeeting.subject,
				title: newMeeting.title,
				lectures: lecturesDiff,
			});
		}

		return result;
	}

	#getLecturesDiff(oldMeeting: Meeting, newMeeting: Meeting): Lecture[] {
		const oldLength = oldMeeting.lectures.length;
		const newLength = newMeeting.lectures.length;
		let result: Lecture[] = [];

		if (newLength > oldLength) {
			result = result.concat(newMeeting.lectures.slice(oldLength));
		}

		for (let i = 0; i < oldMeeting.lectures.length; i++) {
			const oldLecture = oldMeeting.lectures[i];
			const currentLecture = newMeeting.lectures[i];
			const isEqual = compareLecture(oldLecture, currentLecture);
			if (isEqual) continue;
			result.push(currentLecture);
		}

		return result;
	}

	public async handle() {
		await this.#httpClient.collectCookies();
		this.#logger.info("fetching lms content...");
		const subjectsContent = await this.#httpClient.fetchSubjectsContent();
		const subjects = await this.#collector.collectSubjects(subjectsContent);
		const diffingTasks = subjects.map(async (subject) => {
			this.#logger.info(`Handling course: ${subject.courseId}`);

			const [oldSubjectString, subjectError] = await wrapPromiseResult(
				this.#storage.get(`subject_${subject.courseId}`),
			);
			if (subjectError !== null) {
				this.#logger.error(subjectError.message);
				await this.#webhook.error(
					`Failed to get old data for: ${subject.courseId}. Reason: ${subjectError.message}`,
				);
				return;
			}

			if (oldSubjectString !== null) {
				this.#logger.info(`Comparing subjects for: ${subject.courseId}`);
				const oldSubject = JSON.parse(oldSubjectString) as Subject;
				if (
					subject.meetings.length > 0 &&
					oldSubject !== null &&
					oldSubject.meetings.length > 0
				) {
					const meetingsDiff = this.#getMeetingsDiff(oldSubject, subject);
					if (meetingsDiff.length > 0) {
						await this.#webhook.notify({
							...subject,
							meetings: meetingsDiff,
						});
					}
				}
			}

			try {
				this.#logger.info(`Saving new data for: ${subject.courseId}`);
				await this.#storage.set(
					`subject_${subject.courseId}`,
					JSON.stringify(subject),
				);
			} catch (err: unknown) {
				if (err instanceof Error) {
					this.#logger.error(err.message);
					await this.#webhook.error(
						`Failed to save new data for: ${subject.courseId}. Reason: ${err.message}`,
					);
				}
			}
		});

		try {
			this.#logger.info("Handling subjects...");
			await Promise.all(diffingTasks);
			this.#logger.info("Subjects handled");
		} catch (err: unknown) {
			if (err instanceof Error) {
				this.#logger.error(err.message);
				await this.#webhook.error(err.message);
			}
		}
	}
}
