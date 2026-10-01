import { beforeAll, describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import db from "../../../src/db/connection.js";
import {
	addVote,
	createJoke,
	getJokeById,
	incrementViews,
} from "../../../src/db/queries.js";
import {
	logInAsNewAdmin,
	postAsAdmin,
	type TestSession,
} from "../../helpers/admin.js";

const createJokeWithActivity = () => {
	const id = createJoke(db, {
		type: "phrase",
		category: "clásico",
		content: "¡Fistro duodenal!",
	});
	for (let vote = 0; vote < 12; vote++) {
		addVote(db, id, vote < 9 ? "up" : "down");
	}
	for (let view = 0; view < 40; view++) {
		incrementViews(db, id);
	}
	return id;
};

describe("Admin delete joke", () => {
	let session: TestSession;

	beforeAll(async () => {
		session = await logInAsNewAdmin();
	});

	it("should show the confirmation with the votes and views to delete", async () => {
		const jokeId = createJokeWithActivity();

		const response = await app.inject({
			method: "GET",
			url: `/admin/jokes/${jokeId}/delete`,
			headers: { cookie: session.cookie },
		});

		expect(response.statusCode).toBe(200);
		expect(response.body).toContain(`Delete joke #${jokeId}?`);
		expect(response.body).toContain("¡Fistro duodenal!");
		expect(response.body).toContain("clásico");
		expect(response.body).toContain(
			"This also deletes 12 votes and 40 views. You cannot undo this.",
		);
	});

	it("should delete the joke, its votes and its stats", async () => {
		const jokeId = createJokeWithActivity();

		const response = await postAsAdmin(
			`/admin/jokes/${jokeId}/delete`,
			{},
			session,
		);

		expect(response.statusCode).toBe(302);
		expect(response.headers.location).toBe("/admin/jokes?notice=deleted");
		expect(getJokeById(db, jokeId)).toBeUndefined();
		expect(
			db
				.prepare("SELECT COUNT(*) as n FROM votes WHERE joke_id = ?")
				.get(jokeId),
		).toEqual({ n: 0 });
		expect(
			db
				.prepare("SELECT COUNT(*) as n FROM stats WHERE joke_id = ?")
				.get(jokeId),
		).toEqual({ n: 0 });
		const publicJoke = await app.inject({
			method: "GET",
			url: `/api/jokes/${jokeId}`,
		});
		expect(publicJoke.statusCode).toBe(404);
	});

	it("should link to the delete page from the list and the edit form", async () => {
		const jokeId = createJokeWithActivity();
		const deleteLink = `href="/admin/jokes/${jokeId}/delete"`;

		const list = await app.inject({
			method: "GET",
			url: "/admin/jokes",
			headers: { cookie: session.cookie },
		});
		const editForm = await app.inject({
			method: "GET",
			url: `/admin/jokes/${jokeId}/edit`,
			headers: { cookie: session.cookie },
		});

		expect(list.body).toContain(deleteLink);
		expect(editForm.body).toContain(deleteLink);
	});

	it("should show the deleted notice", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/admin/jokes?notice=deleted",
			headers: { cookie: session.cookie },
		});

		expect(response.body).toContain("Joke deleted, with its votes and views.");
	});

	it("should answer 404 for a joke that does not exist", async () => {
		const confirmation = await app.inject({
			method: "GET",
			url: "/admin/jokes/9999/delete",
			headers: { cookie: session.cookie },
		});
		const deletion = await postAsAdmin("/admin/jokes/9999/delete", {}, session);

		expect(confirmation.statusCode).toBe(404);
		expect(deletion.statusCode).toBe(404);
	});
});
