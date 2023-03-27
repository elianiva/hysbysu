import { API_BASE_URL } from "~/env";
import type { Subject } from "~/types/Subject";

type SubjectResponse = {
	subjects: Subject[];
};

/** @type {import("./$types").PageLoad} */
export async function load({ fetch }) {
	const response = await fetch(`${API_BASE_URL}/subjects`);
	return (await response.json()) as SubjectResponse;
}
