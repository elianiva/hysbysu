import { Env } from "~/types/env";
import { HttpClient } from "./HttpClient";
import { ICollector } from "./interfaces/ICollector";
import { Subject } from "~/business/Subject";
import { compareMeeting, Meeting } from "~/business/Meeting";
import { compareLecture, Lecture } from "~/business/Lecture";

export class Worker {
	#httpClient: HttpClient;
	#collector: ICollector;
	#env: Env;

	constructor(httpClient: HttpClient, env: Env, collector: ICollector) {
		this.#httpClient = httpClient;
		this.#env = env;
		this.#collector = collector;
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
		const subjectsContent = await this.#httpClient.fetchSubjectsContent();
		const subjects = await this.#collector.collectSubjects(subjectsContent);
		const diffingTasks = subjects.map(async (subject) => {
			const oldSubjectString = await this.#env.HYSBYSU_STORAGE.get(`subject_${subject.courseId}`);
			if (oldSubjectString === null) return;
			const oldSubject = JSON.parse(oldSubjectString) as Subject;

			if (subject.meetings.length > 0 && oldSubject !== null && oldSubject.meetings.length > 0) {
				const meetingsDiff = this.#getMeetingsDiff(oldSubject, subject);
				if (meetingsDiff.length > 0) {
					console.log({ meetingsDiff });
					// this.#presenter.notify(meetingsDiff);
				}
			}

			await this.#env.HYSBYSU_STORAGE.put(`subject_${subject.courseId}`, JSON.stringify(subject));
		});
		try {
			await Promise.all(diffingTasks);
		} catch (err: unknown) {
			if (err instanceof Error) {
				console.log(err);
			}
		}
	}
}
