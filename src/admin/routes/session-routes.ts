import { randomBytes } from "node:crypto";
import type { FastifyPluginAsync } from "fastify";
import { deleteSession, findAdminByEmail } from "../../db/admin-queries.js";
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
			const admin = findAdminByEmail(db, normalizeEmail(request.body.email));
			const passwordMatches = await verifyPassword(
				request.body.password,
				admin?.passwordHash ?? unknownAdminPasswordHash,
			);
			const isValid = admin !== undefined && passwordMatches;

			if (!admin || !isValid) {
				return reply.status(401).view("login.eta", {
					error: "Invalid email or password.",
					email: request.body.email,
					next: request.body.next,
				});
			}

			reply.setCookie(SESSION_COOKIE, startSession(db, admin.id, new Date()), {
				httpOnly: true,
				sameSite: "lax",
				path: "/admin",
				secure: secureCookie,
			});
			return reply.redirect(resolveNextPath(request.body.next));
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
