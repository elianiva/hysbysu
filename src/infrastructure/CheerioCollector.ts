import * as cheerio from "cheerio";
import type { IMeetingCollector } from "~/domain/interfaces/ICollector";
import { Meeting } from "~/domain/Meeting";
import { Lecture, LectureType } from "~/domain/Lecture";

export class CheerioCollector implements IMeetingCollector {
	private readonly TOPIC_ITEM = ".topics > li[id^='section-'] .content";
	private readonly SUBJECT_NAME = ".page-header-headings > h1";
	private readonly SECTION_TITLE = ".sectionname";
	private readonly LECTURE_LIST = "ul.section > li";
	private readonly ACTIVITY_INSTANCE = ".activityinstance a";
	private readonly INSTANCE_NAME = ".instancename";
	private readonly MODTYPE_RESOURCE = "modtype_resource";
	private readonly MODTYPE_ASSIGNMENT = "modtype_assign";
	private readonly MODTYPE_QUIZ = "modtype_quiz";
	private readonly MODTYPE_URL = "modtype_url";

	public collect(html: string): Meeting[] {
		const $ = cheerio.load(html);
		const topics = $(this.TOPIC_ITEM)
			.slice(1)
			.map((_, el) => {
				const $$ = cheerio.load(el);
				const subjectName = $(this.SUBJECT_NAME).text();
				const sectionTitle = $$(this.SECTION_TITLE).text();
				const lectures = $$(this.LECTURE_LIST)
					.map((_, el) => {
						const $$$ = cheerio.load(el);
						const activityInstance = $$$(this.ACTIVITY_INSTANCE);

						const classAttrib = el.attribs["class"];
						const isResource = classAttrib.includes(this.MODTYPE_RESOURCE);
						const isAssignment = classAttrib.includes(this.MODTYPE_ASSIGNMENT);
						const isQuiz = classAttrib.includes(this.MODTYPE_QUIZ);
						const isUrl = classAttrib.includes(this.MODTYPE_URL);

						let lectureType: LectureType = "unknown";
						switch (true) {
							case isResource:
								lectureType = "resource";
								break;
							case isAssignment:
								lectureType = "assignment";
								break;
							case isQuiz:
								lectureType = "quiz";
								break;
							case isUrl:
								lectureType = "url";
								break;
						}

						return new Lecture({
							name: activityInstance.find(this.INSTANCE_NAME).text() || "Unknown",
							url: activityInstance.attr("href") || "/",
							type: lectureType,
						});
					})
					.get();

				return new Meeting({
					subject: subjectName,
					title: sectionTitle,
					lectures: lectures,
				});
			})
			.get();

		return topics;
	}
}
