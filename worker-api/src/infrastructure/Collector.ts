import * as cheerio from "cheerio";
import { HttpClient } from "~/application/HttpClient";
import { ICollector } from "~/application/interfaces/ICollector";
import { Lecture, LECTURE_TYPE, LectureType } from "~/business/Lecture";
import { Lecturer } from "~/business/Lecturer";
import { Meeting } from "~/business/Meeting";
import { Subject } from "~/business/Subject";
import { ILogger } from "~/application/interfaces/ILogger";

const SELECTOR = {
	subjectCard: ".gallery_grid_item.md-card-content > a",
	subjectName: ".page-header-headings",
	topicItem: ".topics > li .content",
	sectionTitle: ".sectionname",
	lectureList: "ul.section > li",
	activityInstance: ".activityinstance a",
	instanceName: ".instancename",
	modtypeResource: "modtype_resource",
	modtypeAssignment: "modtype_assign",
	modtypeQuiz: "modtype_quiz",
	modtypeUrl: "modtype_url",
	modtypeForum: "modtype_forum",
	modtypePage: "modtype_page",
	summaryImages: ".summary img",
	lecturerName: ".summary td strong",
} as const;

export class Collector implements ICollector {
	#httpClient: HttpClient;
	#logger: ILogger;

	constructor(httpClient: HttpClient, logger: ILogger) {
		this.#httpClient = httpClient;
		this.#logger = logger;
	}

	#extractLecture(node: cheerio.Cheerio<cheerio.Element>): Lecture | undefined {
		const activityInstance = node.find(SELECTOR.activityInstance);
		const classAttribute = node.attr("class");
		if (classAttribute === undefined) return undefined;

		const name = activityInstance.find(SELECTOR.instanceName).text();
		const url = activityInstance.attr("href");
		if (url === undefined) return undefined;

		let lectureType: LectureType = LECTURE_TYPE.unknown;
		let deadline = undefined;
		switch (true) {
			case classAttribute.includes(SELECTOR.modtypeResource):
				lectureType = LECTURE_TYPE.resource;
				break;
			case classAttribute.includes(SELECTOR.modtypeAssignment):
				lectureType = LECTURE_TYPE.assignment;
				break;
			case classAttribute.includes(SELECTOR.modtypeQuiz):
				lectureType = LECTURE_TYPE.quiz;
				break;
			case classAttribute.includes(SELECTOR.modtypeUrl):
				lectureType = LECTURE_TYPE.url;
				break;
			case classAttribute.includes(SELECTOR.modtypeForum):
				lectureType = LECTURE_TYPE.forum;
				break;
			case classAttribute.includes(SELECTOR.modtypePage):
				lectureType = LECTURE_TYPE.page;
				break;
		}

		return new Lecture(name, url, lectureType, deadline);
	}

	#extractMeeting(element: cheerio.Cheerio<cheerio.Element>): Meeting {
		const sectionTitle = element.find(SELECTOR.sectionTitle).text();
		const $lectures = element.find(SELECTOR.lectureList) ?? [];
		const lectures = $lectures
			.map((_, el) => {
				const $ = cheerio.load(element.html(), null, false);
				const node = $(el);
				return this.#extractLecture(node);
			})
			.get()
			.filter((lecture) => lecture !== undefined);

		return new Meeting("<unknown>", sectionTitle, lectures);
	}

	#extractLecturer(html: string): Lecturer {
		const $ = cheerio.load(html);
		let name = $(SELECTOR.lecturerName).first().text();
		let imageUrl =
			$(SELECTOR.summaryImages).children().next().attr("src") ??
			"https://twirpz.files.wordpress.com/2015/06/twitter-avi-gender-balanced-figure.png";

		// conditionally append the protocol to handle the lecturer image source correctly
		if (!imageUrl.startsWith("https://")) {
			imageUrl = "https:" + imageUrl;
		}

		if (name.length === 0) {
			name = "<unknown>";
		}

		return new Lecturer(name, imageUrl);
	}

	#collectMeetings(rawMeetings: string): { subjectName: string; meetings: Meeting[] } {
		const $ = cheerio.load(rawMeetings);
		const subjectName = $(SELECTOR.subjectName).text();
		// skip one because the first topicEl is just the detail of the course
		return {
			subjectName,
			meetings: $(SELECTOR.topicItem)
				.slice(1)
				.map((_, el) => {
					const node = $(el);
					const meeting = this.#extractMeeting(node);
					meeting.subject = subjectName;
					return new Meeting(meeting.subject, meeting.title, meeting.lectures);
				})
				.get(),
		};
	}

	public collectSubjectLinks(html: string): string[] {
		const $ = cheerio.load(html);
		return $(SELECTOR.subjectCard)
			.map((_, el) => $(el).attr("href"))
			.get()
			.filter((url) => url !== undefined);
	}

	public async collectSubjects(rawSubjects: string): Promise<Subject[]> {
		const links = this.collectSubjectLinks(rawSubjects);
		const subjects = await Promise.all(
			links.map(async (link) => {
				const url = new URL(link);
				const id = url.searchParams.get("id");
				if (id === null) return undefined;
				this.#logger.info(`collecting content for ${id}`);
				const lmsContent = await this.#httpClient.fetchLmsContent(link);
				const { subjectName, meetings } = this.#collectMeetings(lmsContent);
				const lecturer = this.#extractLecturer(lmsContent);
				this.#logger.info(`done with ${id}`);
				return new Subject(subjectName, lecturer, id, meetings);
			})
		);
		return subjects.filter((subject): subject is Subject => subject !== undefined);
	}
}
