import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import {
	createJoke,
	getAllJokes,
	getJokeById,
	updateJoke,
} from "../../db/queries.js";
import type { NewJoke } from "../../types/index.js";
import {
	JOKE_TYPES,
	type JokeFormErrors,
	validateJokeForm,
} from "../joke-form.js";
import type { AdminPluginOptions } from "../plugin.js";

interface JokeParams {
	id: string;
}

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
	["updated", "Joke updated."],
]);

const EMPTY_JOKE: NewJoke = { type: "phrase", category: "", content: "" };

const renderJokeForm = (
	request: FastifyRequest,
	reply: FastifyReply,
	values: NewJoke,
	{ jokeId, errors = {} }: { jokeId?: number; errors?: JokeFormErrors } = {},
) =>
	reply.view("jokes/form.eta", {
		session: request.adminSession,
		jokeTypes: JOKE_TYPES,
		jokeId,
		values,
		errors,
	});

const renderJokeNotFound = (request: FastifyRequest, reply: FastifyReply) =>
	reply
		.status(404)
		.view("jokes/not-found.eta", { session: request.adminSession });

const hasErrors = (errors: JokeFormErrors): boolean =>
	Object.keys(errors).length > 0;

export const jokeRoutes: FastifyPluginAsync<AdminPluginOptions> = async (
	app,
	{ db },
) => {
	const findJoke = (params: JokeParams) => getJokeById(db, Number(params.id));

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
			if (hasErrors(errors)) {
				return renderJokeForm(request, reply.status(400), request.body, {
					errors,
				});
			}
			createJoke(db, joke);
			return reply.redirect("/admin/jokes?notice=created");
		},
	);

	app.get<{ Params: JokeParams }>("/jokes/:id/edit", (request, reply) => {
		const joke = findJoke(request.params);
		if (!joke) {
			return renderJokeNotFound(request, reply);
		}
		return renderJokeForm(request, reply, joke, { jokeId: joke.id });
	});

	app.post<{ Params: JokeParams; Body: NewJoke }>(
		"/jokes/:id",
		{ schema: { body: jokeBodySchema } },
		(request, reply) => {
			const existingJoke = findJoke(request.params);
			if (!existingJoke) {
				return renderJokeNotFound(request, reply);
			}
			const { joke, errors } = validateJokeForm(request.body);
			if (hasErrors(errors)) {
				return renderJokeForm(request, reply.status(400), request.body, {
					jokeId: existingJoke.id,
					errors,
				});
			}
			updateJoke(db, existingJoke.id, joke);
			return reply.redirect("/admin/jokes?notice=updated");
		},
	);
};
