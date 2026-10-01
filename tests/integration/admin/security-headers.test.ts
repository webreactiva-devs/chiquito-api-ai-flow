import { beforeAll, describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import { logInAsNewAdmin } from "../../helpers/admin.js";

describe("Admin security headers", () => {
	let cookie: string;

	beforeAll(async () => {
		({ cookie } = await logInAsNewAdmin());
	});

	it.each([
		"/admin/login",
		"/admin/jokes",
		"/admin/jokes/new",
		"/admin/nope",
	])("should send the security headers and no-store on %s", async (url) => {
		const response = await app.inject({
			method: "GET",
			url,
			headers: { cookie },
		});

		expect(response.headers["content-security-policy"]).toBe(
			"default-src 'self'; base-uri 'none'; object-src 'none'; form-action 'self'; frame-ancestors 'none'",
		);
		expect(response.headers["x-frame-options"]).toBe("DENY");
		expect(response.headers["x-content-type-options"]).toBe("nosniff");
		expect(response.headers["referrer-policy"]).toBe("same-origin");
		expect(response.headers["cache-control"]).toBe("no-store");
	});

	it("should let the browser cache the counter script", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/admin/assets/content-counter.js",
		});

		expect(response.statusCode).toBe(200);
		expect(response.headers["content-type"]).toContain("javascript");
		expect(response.headers["x-content-type-options"]).toBe("nosniff");
		expect(response.headers["cache-control"]).not.toBe("no-store");
	});

	it("should have no inline script in the joke form", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/admin/jokes/new",
			headers: { cookie },
		});

		expect(response.body).toContain(
			'<script src="/admin/assets/content-counter.js" defer></script>',
		);
		expect(response.body).not.toMatch(/<script>/);
	});

	it("should not change the public API headers", async () => {
		const response = await app.inject({ method: "GET", url: "/api/jokes" });

		expect(response.headers["content-security-policy"]).toBeUndefined();
		expect(response.headers["cache-control"]).toBeUndefined();
	});
});
