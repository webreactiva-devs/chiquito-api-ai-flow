import { describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import db from "../../../src/db/connection.js";
import {
	createTestAdmin,
	logIn,
	postForm,
	TEST_PASSWORD,
} from "../../helpers/admin.js";

describe("Admin login", () => {
	it("should redirect to the login page with the requested path", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/admin/jokes/new",
		});

		expect(response.statusCode).toBe(302);
		expect(response.headers.location).toBe(
			"/admin/login?next=%2Fadmin%2Fjokes%2Fnew",
		);
	});

	it("should redirect to the login page with an unknown session", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/admin/jokes",
			headers: { cookie: "sid=not-a-session" },
		});

		expect(response.statusCode).toBe(302);
		expect(response.headers.location).toBe(
			"/admin/login?next=%2Fadmin%2Fjokes",
		);
	});

	it("should show the login form", async () => {
		const response = await app.inject({ method: "GET", url: "/admin/login" });

		expect(response.statusCode).toBe(200);
		expect(response.headers["content-type"]).toContain("text/html");
		expect(response.body).toContain('action="/admin/login"');
	});

	it("should start a session with valid credentials in any letter case", async () => {
		const email = await createTestAdmin("ana@example.com");

		const response = await logIn(email.toUpperCase());

		expect(response.statusCode).toBe(302);
		expect(response.headers.location).toBe("/admin/jokes");
		const cookie = response.cookies.find(({ name }) => name === "sid");
		expect(cookie).toMatchObject({
			httpOnly: true,
			sameSite: "Lax",
			path: "/admin",
		});
		const session = db
			.prepare(
				"SELECT s.id FROM sessions s JOIN admins a ON a.id = s.admin_id WHERE a.email = ?",
			)
			.get(email) as { id: string };
		expect(session.id).toBe(cookie?.value);
	});

	it("should reject a wrong password", async () => {
		const email = await createTestAdmin();

		const response = await logIn(email, "a-wrong-password-1");

		expect(response.statusCode).toBe(401);
		expect(response.body).toContain("Invalid email or password.");
		expect(response.body).toContain(`value="${email}"`);
		expect(response.cookies).toHaveLength(0);
	});

	it("should reject an unknown email with the same message", async () => {
		const response = await logIn("ghost@example.com");

		expect(response.statusCode).toBe(401);
		expect(response.body).toContain("Invalid email or password.");
		expect(response.cookies).toHaveLength(0);
	});

	it("should keep the next path in the login form", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/admin/login?next=%2Fadmin%2Fjokes%2Fnew",
		});

		expect(response.body).toContain(
			'<input type="hidden" name="next" value="/admin/jokes/new">',
		);
	});

	it("should return to the requested page after login", async () => {
		const email = await createTestAdmin();

		const response = await postForm("/admin/login", {
			email,
			password: TEST_PASSWORD,
			next: "/admin/jokes/new",
		});

		expect(response.headers.location).toBe("/admin/jokes/new");
	});

	it.each([
		"https://evil.example",
		"//evil.example",
		"/api/jokes",
	])("should ignore the unsafe next path %s", async (next) => {
		const email = await createTestAdmin();

		const response = await postForm("/admin/login", {
			email,
			password: TEST_PASSWORD,
			next,
		});

		expect(response.headers.location).toBe("/admin/jokes");
	});
});
