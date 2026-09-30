export type LimitedResult<T> = { busy: true } | { busy: false; value: T };

export const createConcurrencyLimiter = (limit: number) => {
	let active = 0;
	return async <T>(task: () => Promise<T>): Promise<LimitedResult<T>> => {
		if (active >= limit) {
			return { busy: true };
		}
		active++;
		try {
			return { busy: false, value: await task() };
		} finally {
			active--;
		}
	};
};
