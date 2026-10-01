import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { adminPlugin } from "../../../src/admin/plugin.js";
import db from "../../../src/db/connection.js";
import { createTestAdmin, logIn, TEST_PASSWORD } from "../../helpers/admin.js";

describe("Admin session cookie Secure attribute", () => {
	it("should set Secure by default", async () => {
		const response = await logIn(await createTestAdmin());

		expect(response.cookies[0]).toMatchObject({ name: "sid", secure: true });
	});

	it("should not set Secure when secureCookie is false", async () => {
		const localHttpApp = Fastify();
		await localHttpApp.register(adminPlugin, {
			prefix: "/admin",
			db,
			secureCookie: false,
		});
		const email = await createTestAdmin();

		const response = await localHttpApp.inject({
			method: "POST",
			url: "/admin/login",
			payload: new URLSearchParams({
				email,
				password: TEST_PASSWORD,
			}).toString(),
			headers: { "content-type": "application/x-www-form-urlencoded" },
		});

		expect(response.cookies[0].name).toBe("sid");
		expect(response.cookies[0].secure).toBeUndefined();
		await localHttpApp.close();
	});
});
