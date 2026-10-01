import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
	hashSessionId,
	isSessionExpired,
	startSession,
} from "../../../src/admin/sessions.js";
import { createAdmin, findSessionById } from "../../../src/db/admin-queries.js";
import { createTestDatabase } from "../../helpers/database.js";

const loginTime = new Date("2026-09-30T10:00:00.000Z");
const afterLogin = (milliseconds: number) =>
	new Date(loginTime.getTime() + milliseconds);
const DAY = 24 * 60 * 60 * 1000;

describe("sessions", () => {
	const db = createTestDatabase();
	const adminId = createAdmin(db, "ana@example.com", "hash");

	it("should expire a session 24 hours after login", () => {
		const session = findSessionById(
			db,
			hashSessionId(startSession(db, adminId, loginTime)),
		);

		expect(session?.expiresAt).toBe("2026-10-01T10:00:00.000Z");
		expect(session && isSessionExpired(session, afterLogin(DAY - 1000))).toBe(
			false,
		);
		expect(session && isSessionExpired(session, afterLogin(DAY))).toBe(true);
	});

	it("should store the SHA-256 hash of the session id, not the cookie value", () => {
		const sessionId = startSession(db, adminId, loginTime);

		expect(findSessionById(db, sessionId)).toBeUndefined();
		expect(findSessionById(db, hashSessionId(sessionId))?.id).toBe(
			createHash("sha256").update(sessionId).digest("hex"),
		);
	});

	it("should delete expired sessions on each login", () => {
		const oldSessionId = startSession(db, adminId, loginTime);

		startSession(db, adminId, afterLogin(DAY));

		expect(findSessionById(db, hashSessionId(oldSessionId))).toBeUndefined();
	});
});
