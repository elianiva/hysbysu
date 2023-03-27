import { Env } from "~/types/env";
import { HttpClient } from "./HttpClient";
import { ICollector } from "./interfaces/ICollector";
import { Subject } from "~/business/Subject";
import { Meeting } from "~/business/Meeting";
import { Lecture } from "~/business/Lecture";

export class Worker {
	private _httpClient: HttpClient;
	#collector: ICollector;
	private _env: Env;

	constructor(httpClient: HttpClient, env: Env, collector: ICollector) {
		this._httpClient = httpClient;
		this._env = env;
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
			const isEqual = slicedMeetings[i].compare(oldMeeting);
			const lecturesDiff = this.#getLecturesDiff(oldMeeting, currentMeeting);
			if (isEqual && lecturesDiff.length < 1) continue;
			result.push(new Meeting(currentMeeting.subject, currentMeeting.title, lecturesDiff));
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
				const isEqual = oldLecture.compare(currentLecture);
				if (isEqual) continue;
				result.push(currentLecture);
			}
		}

		return result;
	}

	public async handle() {
		await this._httpClient.collectCookies();
		const subjectsContent = await this._httpClient.fetchSubjectsContent();
		const subjects = await this.#collector.collectSubjects(subjectsContent);
		const diffingTasks = subjects.map(async (subject) => {
			const oldSubjectString = await this._env.HYSBYSU_STORAGE.get(`subject_${subject.courseId}`);
			const oldSubject = Subject.fromJson(oldSubjectString);

			if (subject.meetings.length > 0 && oldSubject !== null && oldSubject.meetings.length > 0) {
				const meetingsDiff = this.#getMeetingsDiff(oldSubject, subject);
				if (meetingsDiff.length > 0) {
					console.log({ meetingsDiff });
				}
			}

			await this._env.HYSBYSU_STORAGE.put(`subject_${subject.courseId}`, JSON.stringify(subject));
		});
		await Promise.all(diffingTasks);
	}
}
