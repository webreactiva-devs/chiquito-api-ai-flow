import { join } from "node:path";
import cookie from "@fastify/cookie";
import formbody from "@fastify/formbody";
import fastifyStatic from "@fastify/static";
import view from "@fastify/view";
import type Database from "better-sqlite3";
import { Eta } from "eta";
import type { FastifyPluginAsync } from "fastify";
import { jokeRoutes } from "./routes/joke-routes.js";
import { sessionRoutes } from "./routes/session-routes.js";
import { requireSession } from "./sessions.js";

export interface AdminPluginOptions {
	db: Database.Database;
}

const viewsDirectory = join(import.meta.dirname, "views");
const assetsDirectory = join(import.meta.dirname, "../../public/admin");

const protectedRoutes: FastifyPluginAsync<AdminPluginOptions> = async (
	app,
	{ db },
) => {
	app.decorateRequest("adminSession");
	app.addHook("onRequest", requireSession(db));
	await app.register(jokeRoutes, { db });
};

export const adminPlugin: FastifyPluginAsync<AdminPluginOptions> = async (
	app,
	{ db },
) => {
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
	await app.register(sessionRoutes, { db });
	await app.register(protectedRoutes, { db });
};
