import { describe, expect, it } from "vitest";
import { createConcurrencyLimiter } from "../../../src/admin/concurrency-limiter.js";

const deferred = () => {
	let resolve: () => void = () => {};
	let reject: (error: Error) => void = () => {};
	const promise = new Promise<void>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});
	return { promise, resolve, reject };
};

describe("createConcurrencyLimiter", () => {
	it("should run tasks up to the limit and reject the next one", async () => {
		const limit = createConcurrencyLimiter(2);
		const first = deferred();
		const second = deferred();

		const running = [limit(() => first.promise), limit(() => second.promise)];
		const rejected = await limit(async () => "third");

		expect(rejected).toEqual({ busy: true });
		first.resolve();
		second.resolve();
		expect(await Promise.all(running)).toEqual([
			{ busy: false, value: undefined },
			{ busy: false, value: undefined },
		]);
	});

	it("should accept a task again after one finishes", async () => {
		const limit = createConcurrencyLimiter(1);
		const first = deferred();
		const running = limit(() => first.promise);

		first.resolve();
		await running;

		expect(await limit(async () => "next")).toEqual({
			busy: false,
			value: "next",
		});
	});

	it("should free the slot when a task throws", async () => {
		const limit = createConcurrencyLimiter(1);
		const failing = deferred();
		const running = limit(() => failing.promise);

		failing.reject(new Error("fistro"));
		await expect(running).rejects.toThrow("fistro");

		expect(await limit(async () => "next")).toEqual({
			busy: false,
			value: "next",
		});
	});
});
