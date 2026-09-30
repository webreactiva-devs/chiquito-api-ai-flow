import { beforeAll, describe, expect, it } from "vitest";
import db from "../../../src/db/connection.js";
import {
	logInAsNewAdmin,
	postForm,
	type TestSession,
} from "../../helpers/admin.js";

const jokeFields = {
	type: "joke",
	category: "absurdo",
	content: "Un chiste que no se debe guardar",
};

const countJokes = () =>
	(db.prepare("SELECT COUNT(*) as count FROM jokes").get() as { count: number })
		.count;

describe("Admin CSRF protection", () => {
	let session: TestSession;
	let otherSession: TestSession;

	beforeAll(async () => {
		session = await logInAsNewAdmin();
		otherSession = await logInAsNewAdmin();
	});

	it.each([
		["without a token", () => ({})],
		["with a wrong token", () => ({ _csrf: "not-the-token" })],
		[
			"with the token of another session",
			() => ({ _csrf: otherSession.csrfToken }),
		],
	])("should reject a form %s", async (_case, tokenField) => {
		const jokesBefore = countJokes();

		const response = await postForm(
			"/admin/jokes",
			{ ...jokeFields, ...tokenField() },
			session.cookie,
		);

		expect(response.statusCode).toBe(403);
		expect(response.body).toContain(
			"Your form expired. Go back and try again.",
		);
		expect(countJokes()).toBe(jokesBefore);
	});

	it("should reject a logout without a token", async () => {
		const response = await postForm("/admin/logout", {}, session.cookie);

		expect(response.statusCode).toBe(403);
	});

	it("should redirect a form without a session to the login page", async () => {
		const jokesBefore = countJokes();

		const response = await postForm("/admin/jokes", jokeFields);

		expect(response.statusCode).toBe(302);
		expect(response.headers.location).toBe("/admin/login");
		expect(countJokes()).toBe(jokesBefore);
	});
});
