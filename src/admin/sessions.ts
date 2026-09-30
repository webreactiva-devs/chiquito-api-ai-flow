import { randomBytes } from "node:crypto";
import type Database from "better-sqlite3";
import type { onRequestHookHandler } from "fastify";
import {
	createSession,
	deleteExpiredSessions,
	deleteSession,
	findSessionById,
} from "../db/admin-queries.js";
import type { AdminSession } from "../types/index.js";
import { loginPath } from "./next-path.js";

declare module "fastify" {
	interface FastifyRequest {
		adminSession: AdminSession;
	}
}

export const SESSION_COOKIE = "sid";
const SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000;

const randomToken = (): string => randomBytes(32).toString("base64url");

export const isSessionExpired = (session: AdminSession, now: Date): boolean =>
	session.expiresAt <= now.toISOString();

export const startSession = (
	db: Database.Database,
	adminId: number,
	now: Date,
): string => {
	deleteExpiredSessions(db, now);
	const id = randomToken();
	createSession(db, {
		id,
		adminId,
		csrfToken: randomToken(),
		createdAt: now.toISOString(),
		expiresAt: new Date(now.getTime() + SESSION_LIFETIME_MS).toISOString(),
	});
	return id;
};

export const requireSession =
	(db: Database.Database): onRequestHookHandler =>
	async (request, reply) => {
		const sessionId = request.cookies[SESSION_COOKIE];
		const session = sessionId ? findSessionById(db, sessionId) : undefined;
		if (session && !isSessionExpired(session, new Date())) {
			request.adminSession = session;
			return;
		}

		if (session) {
			deleteSession(db, session.id);
		}
		return reply.redirect(
			loginPath({
				state: session ? "expired" : undefined,
				next: request.method === "GET" ? request.url : undefined,
			}),
		);
	};
