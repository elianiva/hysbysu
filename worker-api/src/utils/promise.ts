export async function wrapPromiseResult<T>(
	promise: Promise<T>,
): Promise<[T | null, Error | null]> {
	try {
		const result = await promise;
		return [result, null];
	} catch (err: unknown) {
		if (err instanceof Error) return [null, err];
		return [null, new Error("Unknown error")];
	}
}
