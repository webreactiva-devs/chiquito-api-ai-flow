import { describe, expect, it } from "vitest";
import { hashSessionId } from "../../../src/admin/sessions.js";
import app from "../../../src/app.js";
import db from "../../../src/db/connection.js";
import { logInAsNewAdmin } from "../../helpers/admin.js";

describe("Admin session expiry", () => {
	it("should store an expiry 24 hours after the login", async () => {
		const { cookie } = await logInAsNewAdmin();

		const session = db
			.prepare(
				"SELECT created_at as createdAt, expires_at as expiresAt FROM sessions WHERE id = ?",
			)
			.get(hashSessionId(cookie.replace("sid=", ""))) as {
			createdAt: string;
			expiresAt: string;
		};

		expect(Date.parse(session.expiresAt) - Date.parse(session.createdAt)).toBe(
			24 * 60 * 60 * 1000,
		);
	});

	it("should send an expired session to the login page and delete it", async () => {
		const { cookie } = await logInAsNewAdmin();
		const sessionId = hashSessionId(cookie.replace("sid=", ""));
		db.prepare("UPDATE sessions SET expires_at = ? WHERE id = ?").run(
			new Date(Date.now() - 1000).toISOString(),
			sessionId,
		);

		const response = await app.inject({
			method: "GET",
			url: "/admin/jokes",
			headers: { cookie },
		});

		expect(response.statusCode).toBe(302);
		expect(response.headers.location).toBe(
			"/admin/login?state=expired&next=%2Fadmin%2Fjokes",
		);
		expect(
			db.prepare("SELECT id FROM sessions WHERE id = ?").get(sessionId),
		).toBeUndefined();
	});

	it("should show the expired message on the login page", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/admin/login?state=expired",
		});

		expect(response.body).toContain("Your session expired. Log in again.");
	});
});
