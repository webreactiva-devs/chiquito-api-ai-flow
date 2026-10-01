import { describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import {
	createTestAdmin,
	logIn,
	postAsAdmin,
	sessionFromLogin,
} from "../../helpers/admin.js";

describe("Admin main path", () => {
	it("should log in, list jokes, create a joke and serve it in the public API", async () => {
		const session = sessionFromLogin(await logIn(await createTestAdmin()));
		const { cookie } = session;

		const listResponse = await app.inject({
			method: "GET",
			url: "/admin/jokes",
			headers: { cookie },
		});
		expect(listResponse.body).toContain("¡Hasta luego, Lucas!");

		const formResponse = await app.inject({
			method: "GET",
			url: "/admin/jokes/new",
			headers: { cookie },
		});
		expect(formResponse.body).toContain('name="_csrf"');

		const createResponse = await postAsAdmin(
			"/admin/jokes",
			{
				type: "joke",
				category: "absurdo",
				content: "¿Te das cuen? Un chiste nuevo",
			},
			session,
		);
		expect(createResponse.statusCode).toBe(302);
		expect(createResponse.headers.location).toBe("/admin/jokes?notice=created");

		const publicJokes = await app.inject({ method: "GET", url: "/api/jokes" });
		const created = publicJokes
			.json()
			.find(
				(joke: { content: string }) =>
					joke.content === "¿Te das cuen? Un chiste nuevo",
			);
		expect(created).toMatchObject({ type: "joke", category: "absurdo" });

		const publicJoke = await app.inject({
			method: "GET",
			url: `/api/jokes/${created.id}`,
		});
		expect(publicJoke.statusCode).toBe(200);
		expect(publicJoke.json().content).toBe("¿Te das cuen? Un chiste nuevo");
	});
});
