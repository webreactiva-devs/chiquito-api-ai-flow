import { hashPassword } from "../../src/admin/password.js";
import app from "../../src/app.js";
import { createAdmin } from "../../src/db/admin-queries.js";
import db from "../../src/db/connection.js";

export const TEST_PASSWORD = "a-long-password-1";

const testPasswordHash = hashPassword(TEST_PASSWORD);
let adminCount = 0;

export const postForm = (
	url: string,
	fields: Record<string, string>,
	cookie?: string,
) =>
	app.inject({
		method: "POST",
		url,
		payload: new URLSearchParams(fields).toString(),
		headers: {
			"content-type": "application/x-www-form-urlencoded",
			...(cookie ? { cookie } : {}),
		},
	});

export const createTestAdmin = async (
	email = `admin${++adminCount}@example.com`,
): Promise<string> => {
	createAdmin(db, email, await testPasswordHash);
	return email;
};

export const logIn = (email: string, password = TEST_PASSWORD) =>
	postForm("/admin/login", { email, password });

export const logInAsNewAdmin = async (): Promise<{ cookie: string }> => {
	const response = await logIn(await createTestAdmin());
	const sessionCookie = response.cookies.find(
		(cookie) => cookie.name === "sid",
	);
	return { cookie: `sid=${sessionCookie?.value}` };
};
