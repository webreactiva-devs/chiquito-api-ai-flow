import { describe, expect, it } from "vitest";
import { loginPath, resolveNextPath } from "../../../src/admin/next-path.js";

describe("resolveNextPath", () => {
	it.each([
		["/admin/jokes/5/edit", "/admin/jokes/5/edit"],
		[
			"/admin/jokes?category=cl%C3%A1sico&page=2",
			"/admin/jokes?category=cl%C3%A1sico&page=2",
		],
	])("should accept the admin path %s", (next, expected) => {
		expect(resolveNextPath(next)).toBe(expected);
	});

	it.each([
		undefined,
		"",
		"https://evil.example",
		"//evil.example",
		"/api/jokes",
		"/admin",
		"/admin/../api/jokes",
		"javascript:alert(1)",
		"http://[",
	])("should replace the unsafe value %s with the joke list", (next) => {
		expect(resolveNextPath(next)).toBe("/admin/jokes");
	});
});

describe("loginPath", () => {
	it("should return the plain login path without state or next", () => {
		expect(loginPath({})).toBe("/admin/login");
	});

	it("should encode the next path", () => {
		expect(loginPath({ next: "/admin/jokes/5/edit" })).toBe(
			"/admin/login?next=%2Fadmin%2Fjokes%2F5%2Fedit",
		);
	});

	it("should put the state before the next path", () => {
		expect(loginPath({ state: "expired", next: "/admin/jokes" })).toBe(
			"/admin/login?state=expired&next=%2Fadmin%2Fjokes",
		);
	});
});
