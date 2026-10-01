import { describe, expect, it } from "vitest";
import {
	findPasswordProblem,
	hashPassword,
	verifyPassword,
} from "../../../src/admin/password.js";

describe("password", () => {
	it("should not store the password in the hash", async () => {
		const hash = await hashPassword("a-long-password-1");

		expect(hash).not.toContain("a-long-password-1");
		expect(hash.startsWith("scrypt$")).toBe(true);
	});

	it("should verify the correct password", async () => {
		const hash = await hashPassword("a-long-password-1");

		expect(await verifyPassword("a-long-password-1", hash)).toBe(true);
	});

	it("should reject a wrong password", async () => {
		const hash = await hashPassword("a-long-password-1");

		expect(await verifyPassword("a-long-password-2", hash)).toBe(false);
	});

	it("should create a different hash each time", async () => {
		const first = await hashPassword("a-long-password-1");
		const second = await hashPassword("a-long-password-1");

		expect(first).not.toBe(second);
	});
});

describe("findPasswordProblem", () => {
	it.each([
		[11, true],
		[12, false],
		[128, false],
		[129, true],
	])("should check a password with %i characters", (length, hasProblem) => {
		expect(findPasswordProblem("a".repeat(length)) !== undefined).toBe(
			hasProblem,
		);
	});

	it("should count an emoji as one character", () => {
		expect(findPasswordProblem("😂".repeat(12))).toBeUndefined();
	});
});
