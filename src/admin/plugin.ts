import { join } from "node:path";
import cookie from "@fastify/cookie";
import formbody from "@fastify/formbody";
import fastifyStatic from "@fastify/static";
import view from "@fastify/view";
import type Database from "better-sqlite3";
import { Eta } from "eta";
import type { FastifyPluginAsync } from "fastify";
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
	await app.register(sessionRoutes, routeOptions);
	await app.register(protectedRoutes, routeOptions);
};
