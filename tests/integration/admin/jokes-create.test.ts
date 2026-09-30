import { beforeAll, describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import db from "../../../src/db/connection.js";
import {
	logInAsNewAdmin,
	postAsAdmin,
	type TestSession,
} from "../../helpers/admin.js";

const countJokes = () =>
	(db.prepare("SELECT COUNT(*) as count FROM jokes").get() as { count: number })
		.count;

describe("Admin create joke", () => {
	let session: TestSession;

	beforeAll(async () => {
		session = await logInAsNewAdmin();
	});

	it("should show an empty form", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/admin/jokes/new",
			headers: { cookie: session.cookie },
		});

		expect(response.statusCode).toBe(200);
		expect(response.body).toContain('<option value="phrase" selected>');
		expect(response.body).not.toContain('role="alert"');
	});

	it("should save trimmed values", async () => {
		const response = await postAsAdmin(
			"/admin/jokes",
			{ type: "phrase", category: " absurdo ", content: " ¡Jarl, jarl! " },
			session,
		);

		expect(response.headers.location).toBe("/admin/jokes?notice=created");
		expect(
			db
				.prepare("SELECT category, content FROM jokes ORDER BY id DESC LIMIT 1")
				.get(),
		).toEqual({ category: "absurdo", content: "¡Jarl, jarl!" });
	});

	it.each([
		[
			"an empty category and content",
			{ type: "joke", category: " ", content: "" },
			["Category is required.", "Content is required."],
		],
		[
			"too long content",
			{ type: "joke", category: "absurdo", content: "a".repeat(1001) },
			["Content must be 1000 characters or fewer."],
		],
		[
			"an unknown type",
			{ type: "limerick", category: "absurdo", content: "¡Jarl!" },
			["Type must be phrase or joke."],
		],
	])("should show the form again for %s", async (_case, fields, messages) => {
		const jokesBefore = countJokes();

		const response = await postAsAdmin("/admin/jokes", fields, session);

		expect(response.statusCode).toBe(400);
		for (const message of messages) {
			expect(response.body).toContain(message);
		}
		expect(response.body).toContain(`value="${fields.category}"`);
		expect(countJokes()).toBe(jokesBefore);
	});

	it("should keep the sent content in the form", async () => {
		const response = await postAsAdmin(
			"/admin/jokes",
			{ type: "joke", category: "", content: "<b>¡Al ataquer!</b>" },
			session,
		);

		expect(response.body).toContain(
			"&lt;b&gt;¡Al ataquer!&lt;/b&gt;</textarea>",
		);
		expect(response.body).toContain('<option value="joke" selected>');
		expect(response.body).toContain('aria-describedby="category-error"');
		expect(response.body).toContain('id="category-error"');
	});
});
