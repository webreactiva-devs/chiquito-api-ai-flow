import { describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import { runAdminCommand } from "../../../src/cli/admin.js";
import db from "../../../src/db/connection.js";
import {
	createTestAdmin,
	logIn,
	sessionFromLogin,
} from "../../helpers/admin.js";
import { createFakeIo } from "../../helpers/cli.js";

const openJokeList = (cookie: string) =>
	app.inject({ method: "GET", url: "/admin/jokes", headers: { cookie } });

describe("Admin CLI and open sessions", () => {
	it("should close the sessions of a deleted admin", async () => {
		const email = await createTestAdmin();
		const { cookie } = sessionFromLogin(await logIn(email));
		expect((await openJokeList(cookie)).statusCode).toBe(200);

		await runAdminCommand(["delete", "--email", email], createFakeIo(""), db);

		const response = await openJokeList(cookie);
		expect(response.statusCode).toBe(302);
		expect(response.headers.location).toContain("/admin/login");
	});
});
