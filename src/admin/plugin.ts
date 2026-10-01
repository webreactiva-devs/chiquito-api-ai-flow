import { join } from "node:path";
import cookie from "@fastify/cookie";
import formbody from "@fastify/formbody";
import fastifyStatic from "@fastify/static";
import view from "@fastify/view";
import type Database from "better-sqlite3";
import { Eta } from "eta";
import type { FastifyError, FastifyPluginAsync } from "fastify";
import { requireCsrfToken } from "./csrf.js";
import { jokeRoutes } from "./routes/joke-routes.js";
import { logoutRoutes, sessionRoutes } from "./routes/session-routes.js";
import { requireSession } from "./sessions.js";

export interface AdminPluginOptions {
	db: Database.Database;
	secureCookie: boolean;
}

const viewsDirectory = join(import.meta.dirname, "views");
const assetsDirectory = join(import.meta.dirname, "../../public/admin");

const protectedRoutes: FastifyPluginAsync<AdminPluginOptions> = async (
	app,
	options,
) => {
	const { db } = options;
	app.decorateRequest("adminSession");
	app.addHook("onRequest", requireSession(db));
	app.addHook("preValidation", requireCsrfToken);
	await app.register(logoutRoutes, options);
	await app.register(jokeRoutes, options);
};

export const adminPlugin: FastifyPluginAsync<AdminPluginOptions> = async (
	app,
	{ db, secureCookie },
) => {
	const routeOptions = { db, secureCookie };
	await app.register(cookie);
	await app.register(formbody);
	await app.register(fastifyStatic, {
		root: assetsDirectory,
		prefix: "/assets/",
	});
	await app.register(view, {
		engine: { eta: new Eta() },
		root: viewsDirectory,
	});
	app.setNotFoundHandler((request, reply) =>
		reply.status(404).view("error.eta", {
			session: request.adminSession,
			statusCode: 404,
			title: "Page not found, fistro",
			message: "This page does not exist in the admin panel.",
		}),
	);
	app.setErrorHandler((error: FastifyError, request, reply) => {
		const isInvalidForm = error.validation !== undefined;
		if (!isInvalidForm) {
			request.log.error(error);
		}
		return reply.status(isInvalidForm ? 400 : 500).view("error.eta", {
			session: request.adminSession,
			statusCode: isInvalidForm ? 400 : 500,
			title: isInvalidForm ? "Incomplete form" : "Something went wrong",
			message: isInvalidForm
				? "The form is not complete. Go back and try again."
				: "The server could not do this. Try again in a moment.",
		});
	});
	await app.register(sessionRoutes, routeOptions);
	await app.register(protectedRoutes, routeOptions);
};
