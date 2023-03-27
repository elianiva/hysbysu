<script lang="ts">
	import SearchIcon from "~/components/icons/search-icon.svelte";
	import SubjectCard from "~/components/SubjectCard.svelte";

	/** @type {import("./$types").PageData} */
	export let data;

	let SEARCH_CRITERIA = ["subject", "meeting", "lecture"] as const;
	type SearchCriteria = (typeof SEARCH_CRITERIA)[number];
	let selectedCriteria: SearchCriteria[] = [];

	let keyword = "";
	$: keywordRE = new RegExp(keyword, "gi");
	$: filteredSubjects = data.subjects
		.map((subject) => ({
			...subject,
			meetings: subject.meetings
				.map((meeting) => ({
					...meeting,
					lectures: meeting.lectures.filter((lecture) =>
						selectedCriteria.includes("lecture") ? keywordRE.test(lecture.name) : true,
					),
				}))
				.filter((meeting) => (selectedCriteria.includes("meeting") ? keywordRE.test(meeting.title) : true)),
		}))
		.filter((subject) => subject.meetings.length > 0)
		.filter((subject) => (selectedCriteria.includes("subject") ? keywordRE.test(subject.title) : true));
</script>

<div class="absolute top-0 h-44 left-0 right-0 bg-slate-100 border-b-2 border-slate-700 -z-10" />

<div class="py-4 px-10 border-2 rounded-xl border-slate-800 mx-auto w-fit bg-sky-300 shadow-lg">
	<span class="text-4xl font-bold text-slate-800"> cermin siakad </span>
</div>

<div class="bg-white rounded-xl p-2 mt-8 mb-4 w-full border-2 border-slate-700 flex gap-2">
	<input
		bind:value={keyword}
		class="rounded-xl outline-none flex-1 px-4 py-2"
		placeholder="Mau nyari apa bang?"
		type="text"
	/>
	<div class="rounded-xl flex items-center justify-center bg-sky-300 p-2 border-2 border-slate-700">
		<SearchIcon />
	</div>
</div>

<div class="flex flex-col gap-2">
	<p class="font-medium text-center text-xl">Filter Criteria</p>
	<div class="flex gap-2 items-center justify-center">
		{#each SEARCH_CRITERIA as criteria}
			<div
				class="{selectedCriteria.includes(criteria)
					? 'bg-sky-300'
					: 'bg-slate-100'} px-3 py-1 border-2 border-slate-700 rounded-xl cursor-pointer"
				on:click={() => {
					if (selectedCriteria.includes(criteria)) {
						selectedCriteria = selectedCriteria.filter((selected) => selected !== criteria);
					} else {
						selectedCriteria = selectedCriteria.concat([criteria]);
					}
				}}
			>
				{criteria}
			</div>
		{/each}
	</div>
</div>

<div class="flex flex-col gap-10 mt-6 mb-10">
	{#each filteredSubjects as subject}
		<SubjectCard {subject} />
	{/each}
</div>
