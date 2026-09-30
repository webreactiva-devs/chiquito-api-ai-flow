import type { FastifyPluginAsync } from "fastify";
import { createJoke, getAllJokes } from "../../db/queries.js";
import type { NewJoke } from "../../types/index.js";
import type { AdminPluginOptions } from "../plugin.js";

const jokeBodySchema = {
	type: "object",
	required: ["type", "category", "content"],
	properties: {
		type: { type: "string" },
		category: { type: "string" },
		content: { type: "string" },
	},
};

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

	app.get("/jokes/new", (request, reply) =>
		reply.view("jokes/form.eta", { session: request.adminSession }),
	);

	app.post<{ Body: NewJoke }>(
		"/jokes",
		{ schema: { body: jokeBodySchema } },
		(request, reply) => {
			const { type, category, content } = request.body;
			createJoke(db, { type, category, content });
			return reply.redirect("/admin/jokes");
		},
	);
};
