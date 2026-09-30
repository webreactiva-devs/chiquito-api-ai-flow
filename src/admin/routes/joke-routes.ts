import type { FastifyPluginAsync } from "fastify";
import { getAllJokes } from "../../db/queries.js";
import type { AdminPluginOptions } from "../plugin.js";

export const jokeRoutes: FastifyPluginAsync<AdminPluginOptions> = async (
	app,
	{ db },
) => {
	app.get("/", (_request, reply) => reply.redirect("/admin/jokes"));

	app.get("/jokes", (request, reply) =>
		reply.view("jokes/list.eta", {
			session: request.adminSession,
			jokes: getAllJokes(db),
		}),
	);
};
