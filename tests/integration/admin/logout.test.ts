import { describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import db from "../../../src/db/connection.js";
import { logInAsNewAdmin, postForm } from "../../helpers/admin.js";

describe("Admin logout", () => {
	it("should delete the session and redirect to the login page", async () => {
		const { cookie } = await logInAsNewAdmin();
		const sessionId = cookie.replace("sid=", "");

		const response = await postForm("/admin/logout", {}, cookie);

		expect(response.statusCode).toBe(302);
		expect(response.headers.location).toBe("/admin/login?state=loggedout");
		expect(
			db.prepare("SELECT id FROM sessions WHERE id = ?").get(sessionId),
		).toBeUndefined();

		const afterLogout = await app.inject({
			method: "GET",
			url: "/admin/jokes",
			headers: { cookie },
		});
		expect(afterLogout.statusCode).toBe(302);
		expect(afterLogout.headers.location).toBe("/admin/login");
	});

	it("should show the logged out message on the login page", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/admin/login?state=loggedout",
		});

		expect(response.body).toContain("You logged out. Hasta luego, Lucas!");
	});

	it("should ignore an unknown state on the login page", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/admin/login?state=toString",
		});

		expect(response.body).not.toContain('role="status"');
	});

	it("should show the log out button in the layout", async () => {
		const { cookie } = await logInAsNewAdmin();

		const response = await app.inject({
			method: "GET",
			url: "/admin/jokes",
			headers: { cookie },
		});

		expect(response.body).toContain('action="/admin/logout"');
	});
});
