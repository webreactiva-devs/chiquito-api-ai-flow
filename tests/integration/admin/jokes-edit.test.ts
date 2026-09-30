import { beforeAll, describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import db from "../../../src/db/connection.js";
import { createJoke, getJokeById } from "../../../src/db/queries.js";
import {
	logInAsNewAdmin,
	postAsAdmin,
	type TestSession,
} from "../../helpers/admin.js";

describe("Admin edit joke", () => {
	let session: TestSession;
	let jokeId: number;

	beforeAll(async () => {
		session = await logInAsNewAdmin();
		jokeId = createJoke(db, {
			type: "phrase",
			category: "clásico",
			content: "¡Fistro duodenal!",
		});
	});

	const getEditForm = (id: number | string) =>
		app.inject({
			method: "GET",
			url: `/admin/jokes/${id}/edit`,
			headers: { cookie: session.cookie },
		});

	it("should show the form with the current values", async () => {
		const response = await getEditForm(jokeId);

		expect(response.statusCode).toBe(200);
		expect(response.body).toContain(`Edit joke #${jokeId}`);
		expect(response.body).toContain(`action="/admin/jokes/${jokeId}"`);
		expect(response.body).toContain('value="clásico"');
		expect(response.body).toContain("¡Fistro duodenal!</textarea>");
		expect(response.body).toContain("Save changes");
	});

	it("should link each joke in the list to its edit form", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/admin/jokes",
			headers: { cookie: session.cookie },
		});

		expect(response.body).toContain(`href="/admin/jokes/${jokeId}/edit"`);
	});

	it("should save new values and show them in the public API", async () => {
		const response = await postAsAdmin(
			`/admin/jokes/${jokeId}`,
			{
				type: "joke",
				category: " absurdo ",
				content: "¡Pecador de la pradera!",
			},
			session,
		);

		expect(response.statusCode).toBe(302);
		expect(response.headers.location).toBe("/admin/jokes?notice=updated");
		const publicJoke = await app.inject({
			method: "GET",
			url: `/api/jokes/${jokeId}`,
		});
		expect(publicJoke.json()).toMatchObject({
			type: "joke",
			category: "absurdo",
			content: "¡Pecador de la pradera!",
		});
	});

	it("should show errors and not save an invalid form", async () => {
		const before = getJokeById(db, jokeId);

		const response = await postAsAdmin(
			`/admin/jokes/${jokeId}`,
			{ type: "joke", category: "", content: "Sin categoría" },
			session,
		);

		expect(response.statusCode).toBe(400);
		expect(response.body).toContain("Category is required.");
		expect(response.body).toContain(`action="/admin/jokes/${jokeId}"`);
		expect(getJokeById(db, jokeId)).toEqual(before);
	});

	it("should show the updated notice", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/admin/jokes?notice=updated",
			headers: { cookie: session.cookie },
		});

		expect(response.body).toContain("Joke updated.");
	});

	it.each([
		"9999",
		"abc",
		"5abc",
	])("should answer 404 for the edit form of joke %s", async (id) => {
		const response = await getEditForm(id);

		expect(response.statusCode).toBe(404);
		expect(response.body).toContain("Joke not found, fistro");
	});

	it("should answer 404 for an update of a joke that does not exist", async () => {
		const response = await postAsAdmin(
			"/admin/jokes/9999",
			{ type: "joke", category: "absurdo", content: "¡Jarl!" },
			session,
		);

		expect(response.statusCode).toBe(404);
		expect(getJokeById(db, 9999)).toBeUndefined();
	});
});
