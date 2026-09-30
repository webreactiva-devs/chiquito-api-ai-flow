import type { FastifyPluginAsync } from "fastify";
import { findAdminByEmail } from "../../db/admin-queries.js";
import { normalizeEmail } from "../email.js";
import { verifyPassword } from "../password.js";
import type { AdminPluginOptions } from "../plugin.js";
import { SESSION_COOKIE, startSession } from "../sessions.js";

interface LoginBody {
	email: string;
	password: string;
}

const loginBodySchema = {
	type: "object",
	required: ["email", "password"],
	properties: {
		email: { type: "string" },
		password: { type: "string" },
	},
};

export const sessionRoutes: FastifyPluginAsync<AdminPluginOptions> = async (
	app,
	{ db },
) => {
	app.get("/login", (_request, reply) => reply.view("login.eta", {}));

	app.post<{ Body: LoginBody }>(
		"/login",
		{ schema: { body: loginBodySchema } },
		async (request, reply) => {
			const admin = findAdminByEmail(db, normalizeEmail(request.body.email));
			const isValid =
				admin !== undefined &&
				(await verifyPassword(request.body.password, admin.passwordHash));

			if (!admin || !isValid) {
				return reply
					.status(401)
					.view("login.eta", { error: "Invalid email or password." });
			}

			reply.setCookie(SESSION_COOKIE, startSession(db, admin.id, new Date()), {
				httpOnly: true,
				sameSite: "lax",
				path: "/admin",
			});
			return reply.redirect("/admin/jokes");
		},
	);
};
