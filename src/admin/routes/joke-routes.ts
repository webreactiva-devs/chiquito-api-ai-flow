import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { createJoke, getAllJokes } from "../../db/queries.js";
import type { NewJoke } from "../../types/index.js";
import {
	JOKE_TYPES,
	type JokeFormErrors,
	validateJokeForm,
} from "../joke-form.js";
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

const LIST_NOTICES = new Map([
	["welcome", "Welcome back, pecador."],
	["created", "Joke created."],
]);

const EMPTY_JOKE: NewJoke = { type: "phrase", category: "", content: "" };

const renderJokeForm = (
	request: FastifyRequest,
	reply: FastifyReply,
	values: NewJoke,
	errors: JokeFormErrors = {},
) =>
	reply.view("jokes/form.eta", {
		session: request.adminSession,
		jokeTypes: JOKE_TYPES,
		values,
		errors,
	});

export const jokeRoutes: FastifyPluginAsync<AdminPluginOptions> = async (
	app,
	{ db },
) => {
	app.get("/", (_request, reply) => reply.redirect("/admin/jokes"));

	app.get<{ Querystring: { notice?: string } }>("/jokes", (request, reply) =>
		reply.view("jokes/list.eta", {
			session: request.adminSession,
			notice: LIST_NOTICES.get(request.query.notice ?? ""),
			jokes: getAllJokes(db),
		}),
	);

	app.get("/jokes/new", (request, reply) =>
		renderJokeForm(request, reply, EMPTY_JOKE),
	);

	app.post<{ Body: NewJoke }>(
		"/jokes",
		{ schema: { body: jokeBodySchema } },
		(request, reply) => {
			const { joke, errors } = validateJokeForm(request.body);
			if (Object.keys(errors).length > 0) {
				return renderJokeForm(request, reply.status(400), request.body, errors);
			}
			createJoke(db, joke);
			return reply.redirect("/admin/jokes?notice=created");
		},
	);
};
