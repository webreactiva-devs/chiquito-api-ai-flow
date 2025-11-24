import cors from "@fastify/cors";
import Fastify from "fastify";
import db from "./db/connection.js";
import {
	addVote,
	getAllJokes,
	getCategories,
	getGlobalStats,
	getJokeById,
	getJokesByCategory,
	getRandomJoke,
	getTopJokes,
	getViewsByJokeId,
	getVotesByJokeId,
	incrementViews,
} from "./db/queries.js";
import type { VoteType } from "./types/index.js";

const app = Fastify({ logger: false });

await app.register(cors);

app.get("/api/categories", async () => {
	try {
		const categories = getCategories(db);
		return categories;
	} catch (_error) {
		throw {
			statusCode: 500,
			message: "Server error retrieving categories, fistro",
		};
	}
});

app.get("/health", async () => {
	return {
		status: "OK",
		message: "Fistro pecador de la pradera",
		timestamp: new Date().toISOString(),
	};
});

app.get<{ Querystring: { category?: string } }>(
	"/api/jokes",
	async (request) => {
		const { category } = request.query;

		if (category) {
			return getJokesByCategory(db, category);
		}

		return getAllJokes(db);
	},
);

app.get("/api/jokes/random", async () => {
	const randomJoke = getRandomJoke(db);
	if (randomJoke) {
		incrementViews(db, randomJoke.id);
		const votes = getVotesByJokeId(db, randomJoke.id);
		const views = getViewsByJokeId(db, randomJoke.id);
		return { ...randomJoke, ...votes, views };
	}
	return randomJoke;
});

app.get<{ Params: { id: string } }>(
	"/api/jokes/:id",
	async (request, reply) => {
		const id = parseInt(request.params.id, 10);
		const joke = getJokeById(db, id);

		if (!joke) {
			return reply.status(404).send({ error: "Joke not found, fistro" });
		}

		incrementViews(db, id);
		const votes = getVotesByJokeId(db, id);
		const views = getViewsByJokeId(db, id);
		return { ...joke, ...votes, views };
	},
);

app.get("/api/stats", async () => {
	return getGlobalStats(db);
});

app.get<{ Querystring: { by?: string; limit?: string } }>(
	"/api/stats/top",
	async (request) => {
		const by = request.query.by === "views" ? "views" : "votes";
		const limit = parseInt(request.query.limit || "10", 10);
		return getTopJokes(db, by, limit);
	},
);

app.post<{ Params: { id: string }; Body: { type: VoteType } }>(
	"/api/jokes/:id/vote",
	async (request, reply) => {
		const id = parseInt(request.params.id, 10);
		const { type } = request.body;

		if (!type || (type !== "up" && type !== "down")) {
			return reply.status(400).send({ error: "Invalid vote type, fistro" });
		}

		const joke = getJokeById(db, id);
		if (!joke) {
			return reply.status(404).send({ error: "Joke not found, fistro" });
		}

		addVote(db, id, type);
		const votes = getVotesByJokeId(db, id);
		return votes;
	},
);

app.get<{ Params: { id: string } }>(
	"/api/jokes/:id/votes",
	async (request, reply) => {
		const id = parseInt(request.params.id, 10);
		const joke = getJokeById(db, id);

		if (!joke) {
			return reply.status(404).send({ error: "Joke not found, fistro" });
		}

		const votes = getVotesByJokeId(db, id);
		return votes;
	},
);

export default app;
