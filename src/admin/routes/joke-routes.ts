import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import {
	countJokes,
	createJoke,
	deleteJokeWithVotesAndStats,
	getCategories,
	getJokeById,
	getJokeDeleteImpact,
	listJokesWithActivity,
	updateJoke,
} from "../../db/queries.js";
import type { NewJoke } from "../../types/index.js";
import {
	countCharacters,
	JOKE_TYPES,
	type JokeFormErrors,
	MAX_CONTENT_LENGTH,
	validateJokeForm,
} from "../joke-form.js";
import { JOKES_PER_PAGE, paginate, parsePage } from "../pagination.js";
import type { AdminPluginOptions } from "../plugin.js";

interface JokeParams {
	id: string;
}

interface JokeListQuery {
	notice?: string;
	category?: string;
	q?: string;
	page?: string;
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
	["deleted", "Joke deleted, with its votes and views."],
]);

const EMPTY_JOKE: NewJoke = { type: "phrase", category: "", content: "" };

const jokeListUrl = (
	{ category, search }: { category: string; search: string },
	page: number,
): string => {
	const query = new URLSearchParams();
	if (category) {
		query.set("category", category);
	}
	if (search) {
		query.set("q", search);
	}
	query.set("page", String(page));
	return `/admin/jokes?${query}`;
};

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

	const renderJokeForm = (
		request: FastifyRequest,
		reply: FastifyReply,
		values: NewJoke,
		{ jokeId, errors = {} }: { jokeId?: number; errors?: JokeFormErrors } = {},
	) =>
		reply.view("jokes/form.eta", {
			session: request.adminSession,
			jokeTypes: JOKE_TYPES,
			categories: getCategories(db).map(({ name }) => name),
			maxContentLength: MAX_CONTENT_LENGTH,
			contentLength: countCharacters(values.content),
			jokeId,
			values,
			errors,
		});

	app.get("/", (_request, reply) => reply.redirect("/admin/jokes"));

	app.get<{ Querystring: JokeListQuery }>("/jokes", (request, reply) => {
		const { notice, category = "", q: search = "", page } = request.query;
		const filters = { category, search };
		const pagination = paginate(
			countJokes(db, filters),
			parsePage(page),
			JOKES_PER_PAGE,
		);
		return reply.view("jokes/list.eta", {
			session: request.adminSession,
			notice: LIST_NOTICES.get(notice ?? ""),
			categories: getCategories(db).map(({ name }) => name),
			filters,
			pagination,
			pageUrl: (targetPage: number) => jokeListUrl(filters, targetPage),
			jokes: listJokesWithActivity(db, filters, {
				limit: JOKES_PER_PAGE,
				offset: pagination.offset,
			}),
		});
	});

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

	app.get<{ Params: JokeParams }>("/jokes/:id/delete", (request, reply) => {
		const joke = findJoke(request.params);
		if (!joke) {
			return renderJokeNotFound(request, reply);
		}
		return reply.view("jokes/delete.eta", {
			session: request.adminSession,
			joke,
			impact: getJokeDeleteImpact(db, joke.id),
		});
	});

	app.post<{ Params: JokeParams }>("/jokes/:id/delete", (request, reply) => {
		const joke = findJoke(request.params);
		if (!joke) {
			return renderJokeNotFound(request, reply);
		}
		deleteJokeWithVotesAndStats(db, joke.id);
		return reply.redirect("/admin/jokes?notice=deleted");
	});
};
