import { beforeAll, describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import db from "../../../src/db/connection.js";
import { createJoke } from "../../../src/db/queries.js";
import { logInAsNewAdmin } from "../../helpers/admin.js";

describe("Admin joke list", () => {
	let cookie: string;

	beforeAll(async () => {
		({ cookie } = await logInAsNewAdmin());
	});

	const getList = () =>
		app.inject({ method: "GET", url: "/admin/jokes", headers: { cookie } });

	it("should redirect /admin to the joke list", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/admin",
			headers: { cookie },
		});

		expect(response.statusCode).toBe(302);
		expect(response.headers.location).toBe("/admin/jokes");
	});

	it("should list the jokes and the admin email", async () => {
		const response = await getList();

		expect(response.statusCode).toBe(200);
		expect(response.body).toContain("¡Hasta luego, Lucas!");
		expect(response.body).toMatch(/admin\d+@example\.com/);
	});

	it("should escape joke content", async () => {
		createJoke(db, {
			type: "joke",
			category: "absurdo",
			content: "<script>alert('fistro')</script>",
		});

		const response = await getList();

		expect(response.body).toContain("&lt;script&gt;");
		expect(response.body).not.toContain("<script>alert");
	});
});
