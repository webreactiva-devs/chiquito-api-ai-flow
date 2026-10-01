import { describe, expect, it, vi } from "vitest";
import { verifyPassword } from "../../../src/admin/password.js";
import { createTestAdmin, logIn } from "../../helpers/admin.js";

vi.mock("../../../src/admin/password.js", async (importOriginal) => {
	const original =
		await importOriginal<typeof import("../../../src/admin/password.js")>();
	return { ...original, verifyPassword: vi.fn(original.verifyPassword) };
});

describe("Admin login with an unknown email", () => {
	it("should verify a password against a dummy hash", async () => {
		vi.mocked(verifyPassword).mockClear();

		await logIn("ghost@example.com");

		expect(verifyPassword).toHaveBeenCalledTimes(1);
	});

	it("should answer like a wrong password", async () => {
		const email = await createTestAdmin("known@example.com");

		const wrongPassword = await logIn(email, "a-wrong-password-1");
		const unknownEmail = await logIn("ghost@example.com");

		expect(unknownEmail.statusCode).toBe(wrongPassword.statusCode);
		expect(Object.keys(unknownEmail.headers).sort()).toEqual(
			Object.keys(wrongPassword.headers).sort(),
		);
		expect(unknownEmail.body.replace("ghost@example.com", email)).toBe(
			wrongPassword.body,
		);
	});
});
