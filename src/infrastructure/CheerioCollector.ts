import * as cheerio from "cheerio";
import type { IMeetingCollector } from "~/domain/interfaces/ICollector";
import { Meeting } from "~/domain/Meeting";
import { Lecture } from "~/domain/Lecture";

export class CheerioCollector implements IMeetingCollector {
	private readonly TOPIC_ITEM = ".topics > li[id^='section-'] .content";
	private readonly SUBJECT_NAME = ".page-header-headings > h1";
	private readonly SECTION_TITLE = ".sectionname";
	private readonly LECTURE_LIST = "ul.section > li";
	private readonly ACTIVITY_INSTANCE = ".activityinstance a";
	private readonly MODTYPE_RESOURCE = "modtype_resource";
	private readonly MODTYPE_ASSIGNMENT = "modtype_assign";
	private readonly INSTANCE_NAME = ".instancename";

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

						const isResource = el.attribs["class"].includes(this.MODTYPE_RESOURCE);
						const isAssignment = el.attribs["class"].includes(this.MODTYPE_ASSIGNMENT);

						return new Lecture({
							name: activityInstance.find(this.INSTANCE_NAME).text() || "Unknown",
							url: activityInstance.attr("href") || "/",
							type: isResource ? "material" : isAssignment ? "assignment" : "unknown",
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
