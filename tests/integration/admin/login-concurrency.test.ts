import { describe, expect, it, vi } from "vitest";
import { verifyPassword } from "../../../src/admin/password.js";
import app from "../../../src/app.js";
import { createTestAdmin, logIn } from "../../helpers/admin.js";

vi.mock("../../../src/admin/password.js", async (importOriginal) => {
	const original =
		await importOriginal<typeof import("../../../src/admin/password.js")>();
	return { ...original, verifyPassword: vi.fn(original.verifyPassword) };
});

describe("Admin login concurrency limit", () => {
	it("should answer 503 to a fifth login while four are checking passwords", async () => {
		const email = await createTestAdmin();
		let releaseChecks: () => void = () => {};
		const checksBlocked = new Promise<boolean>((resolve) => {
			releaseChecks = () => resolve(false);
		});
		vi.mocked(verifyPassword).mockClear();
		vi.mocked(verifyPassword).mockImplementation(() => checksBlocked);

		const runningLogins = Array.from({ length: 4 }, () => logIn(email));
		await vi.waitFor(() => expect(verifyPassword).toHaveBeenCalledTimes(4));

		const fifthLogin = await logIn(email);
		const publicApi = await app.inject({ method: "GET", url: "/api/jokes" });

		expect(fifthLogin.statusCode).toBe(503);
		expect(fifthLogin.body).toContain(
			"The server is busy. Try again in a moment.",
		);
		expect(verifyPassword).toHaveBeenCalledTimes(4);
		expect(publicApi.statusCode).toBe(200);

		releaseChecks();
		const finishedLogins = await Promise.all(runningLogins);
		expect(finishedLogins.map(({ statusCode }) => statusCode)).toEqual([
			401, 401, 401, 401,
		]);
	});
});
