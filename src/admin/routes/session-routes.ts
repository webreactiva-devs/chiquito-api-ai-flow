import { randomBytes } from "node:crypto";
import type { FastifyPluginAsync } from "fastify";
import { deleteSession, findAdminByEmail } from "../../db/admin-queries.js";
import { createConcurrencyLimiter } from "../concurrency-limiter.js";
import { normalizeEmail } from "../email.js";
import { resolveNextPath } from "../next-path.js";
import { hashPassword, verifyPassword } from "../password.js";
import type { AdminPluginOptions } from "../plugin.js";
import { SESSION_COOKIE, startSession } from "../sessions.js";

interface LoginBody {
	email: string;
	password: string;
	next?: string;
}

const MAX_CONCURRENT_PASSWORD_CHECKS = 4;

const LOGIN_NOTICES = new Map([
	["loggedout", "You logged out. Hasta luego, Lucas!"],
	["expired", "Your session expired. Log in again."],
]);

const loginBodySchema = {
	type: "object",
	required: ["email", "password"],
	properties: {
		email: { type: "string" },
		password: { type: "string" },
		next: { type: "string" },
	},
};

export const sessionRoutes: FastifyPluginAsync<AdminPluginOptions> = async (
	app,
	{ db, secureCookie },
) => {
	const unknownAdminPasswordHash = await hashPassword(
		randomBytes(32).toString("base64url"),
	);
	const limitPasswordChecks = createConcurrencyLimiter(
		MAX_CONCURRENT_PASSWORD_CHECKS,
	);

	app.get<{ Querystring: { state?: string; next?: string } }>(
		"/login",
		(request, reply) =>
			reply.view("login.eta", {
				notice: LOGIN_NOTICES.get(request.query.state ?? ""),
				next: request.query.next,
			}),
	);

	app.post<{ Body: LoginBody }>(
		"/login",
		{ schema: { body: loginBodySchema } },
		async (request, reply) => {
			const { email, password, next } = request.body;
			const admin = findAdminByEmail(db, normalizeEmail(email));
			const passwordCheck = await limitPasswordChecks(() =>
				verifyPassword(
					password,
					admin?.passwordHash ?? unknownAdminPasswordHash,
				),
			);

			if (passwordCheck.busy) {
				return reply.status(503).view("login.eta", {
					error: "The server is busy. Try again in a moment.",
					email,
					next,
				});
			}
			if (!admin || !passwordCheck.value) {
				return reply.status(401).view("login.eta", {
					error: "Invalid email or password.",
					email,
					next,
				});
			}

			reply.setCookie(SESSION_COOKIE, startSession(db, admin.id, new Date()), {
				httpOnly: true,
				sameSite: "lax",
				path: "/admin",
				secure: secureCookie,
			});
			return reply.redirect(
				next ? resolveNextPath(next) : "/admin/jokes?notice=welcome",
			);
		},
	);
};

export const logoutRoutes: FastifyPluginAsync<AdminPluginOptions> = async (
	app,
	{ db },
) => {
	app.post("/logout", (request, reply) => {
		deleteSession(db, request.adminSession.id);
		reply.clearCookie(SESSION_COOKIE, { path: "/admin" });
		return reply.redirect("/admin/login?state=loggedout");
	});
};
