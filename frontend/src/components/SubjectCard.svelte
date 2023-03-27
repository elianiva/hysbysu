<script lang="ts">
	import { LECTURE_TYPE } from "~/types/Lecture.js";
	import UrlIcon from "~/components/icons/url-icon.svelte";
	import PageIcon from "~/components/icons/page-icon.svelte";
	import ForumIcon from "~/components/icons/forum-icon.svelte";
	import QuestionIcon from "~/components/icons/question-icon.svelte";
	import FileIcon from "~/components/icons/file-icon.svelte";
	import QuizIcon from "~/components/icons/url-icon.svelte";
	import ChevronRightIcon from "~/components/icons/chevron-right-icon.svelte";
	import AssignmentIcon from "~/components/icons/assignment-icon.svelte";
	import type { Subject } from "~/types/Subject";
	import autoAnimate from "@formkit/auto-animate";

	export let subject: Subject;

	let isMeetingShown = false;
</script>

<div class="flex flex-col gap-6" use:autoAnimate>
	<div class="relative shadow-lg">
		<div class="with-backdrop bg-sky-200" />
		<div class="relative rounded-xl border-2 border-slate-800 bg-white z-10 p-4">
			<div class="flex justify-between items-center">
				<span class="font-bold text-xl text-slate-800">{subject.title}</span>
				<div
					class="p-2 rounded-lg bg-sky-300 border-2 border-slate-700 cursor-pointer"
					on:click={() => (isMeetingShown = !isMeetingShown)}
					on:keydown={(e) => {
						if (e.key === "Enter") {
							isMeetingShown = !isMeetingShown;
						}
					}}
				>
					<ChevronRightIcon className="transition-transform ease-out {isMeetingShown ? 'rotate-90' : ''}" />
				</div>
			</div>
		</div>
	</div>

	{#if isMeetingShown}
		{#each subject.meetings.filter((meeting) => meeting.lectures.length > 0) as meeting}
			<div class="relative shadow-lg ml-14">
				<div class="with-backdrop bg-red-200" />
				<div class="relative rounded-xl border-2 border-slate-800 bg-white z-10">
					<div class="px-6 py-4">
						<div class="font-bold text-xl mb-2 text-slate-800">{meeting.title}</div>
						<ul class="pl-2 flex flex-col gap-2">
							{#each meeting.lectures as lecture}
								<li class="flex gap-2 items-center relative text-base text-slate-700">
									{#if lecture.type === LECTURE_TYPE.resource}
										<FileIcon />
									{:else if lecture.type === LECTURE_TYPE.assignment}
										<AssignmentIcon />
									{:else if lecture.type === LECTURE_TYPE.url}
										<UrlIcon />
									{:else if lecture.type === LECTURE_TYPE.quiz}
										<QuizIcon />
									{:else if lecture.type === LECTURE_TYPE.forum}
										<ForumIcon />
									{:else if lecture.type === LECTURE_TYPE.page}
										<PageIcon />
									{:else if lecture.type === LECTURE_TYPE.unknown}
										<QuestionIcon />
									{/if}
									<a
										href={lecture.url}
										class="underline underline-offset-4 decoration-dashed decoration-pink-500 text-slate-800"
										>{lecture.name}</a
									>
								</li>
							{/each}
						</ul>
					</div>
				</div>
			</div>
		{/each}
	{/if}
</div>

<style>
	.with-backdrop {
		@apply absolute top-4 -left-2 -right-2 -bottom-2 z-0 border-2 border-slate-700 rounded-xl;
	}
</style>
