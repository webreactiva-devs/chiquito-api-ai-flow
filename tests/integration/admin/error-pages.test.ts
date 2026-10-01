import { beforeAll, describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import {
	createTestAdmin,
	logInAsNewAdmin,
	postForm,
	type TestSession,
} from "../../helpers/admin.js";

describe("Admin error pages", () => {
	let session: TestSession;

	beforeAll(async () => {
		session = await logInAsNewAdmin();
	});

	it.each([
		"1e19",
		"9007199254740993",
	])("should show page 1 for the unsafe page number %s", async (page) => {
		const response = await app.inject({
			method: "GET",
			url: `/admin/jokes?page=${page}`,
			headers: { cookie: session.cookie },
		});

		expect(response.statusCode).toBe(200);
		expect(response.body).toMatch(/Page 1 of \d+/);
	});

	it("should show an HTML 404 page for an unknown admin path", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/admin/does-not-exist",
		});

		expect(response.statusCode).toBe(404);
		expect(response.headers["content-type"]).toContain("text/html");
		expect(response.body).toContain("Page not found, fistro");
	});

	it("should show an HTML 400 page for an incomplete login form", async () => {
		const response = await postForm("/admin/login", {
			email: await createTestAdmin(),
		});

		expect(response.statusCode).toBe(400);
		expect(response.headers["content-type"]).toContain("text/html");
		expect(response.body).toContain(
			"The form is not complete. Go back and try again.",
		);
		expect(response.body).not.toContain("FST_ERR_VALIDATION");
	});

	it("should reject a CSRF token that is not a string with 403", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/admin/jokes/1/delete",
			payload: { _csrf: { value: session.csrfToken } },
			headers: { cookie: session.cookie },
		});

		expect(response.statusCode).toBe(403);
		expect(response.body).toContain("Your form expired");
	});

	it("should keep the public API errors in JSON", async () => {
		const response = await app.inject({ method: "GET", url: "/api/nope" });

		expect(response.statusCode).toBe(404);
		expect(response.headers["content-type"]).toContain("application/json");
	});
});
