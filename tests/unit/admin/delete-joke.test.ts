import type Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";
import {
	addVote,
	createJoke,
	deleteJokeWithVotesAndStats,
	getJokeDeleteImpact,
	incrementViews,
} from "../../../src/db/queries.js";
import { createTestDatabase } from "../../helpers/database.js";

const rowsFor = (db: Database.Database, id: number) => ({
	jokes: db.prepare("SELECT COUNT(*) as n FROM jokes WHERE id = ?").get(id),
	votes: db
		.prepare("SELECT COUNT(*) as n FROM votes WHERE joke_id = ?")
		.get(id),
	stats: db
		.prepare("SELECT COUNT(*) as n FROM stats WHERE joke_id = ?")
		.get(id),
});

describe("joke delete queries", () => {
	let db: Database.Database;
	let jokeId: number;

	beforeEach(() => {
		db = createTestDatabase();
		jokeId = createJoke(db, {
			type: "phrase",
			category: "clásico",
			content: "¡Jarl!",
		});
	});

	it("should count the votes and views that a delete removes", () => {
		addVote(db, jokeId, "up");
		addVote(db, jokeId, "down");
		incrementViews(db, jokeId);

		expect(getJokeDeleteImpact(db, jokeId)).toEqual({ votes: 2, views: 1 });
	});

	it("should count zero for a joke without votes and views", () => {
		expect(getJokeDeleteImpact(db, jokeId)).toEqual({ votes: 0, views: 0 });
	});

	it("should delete the joke with its votes and stats", () => {
		addVote(db, jokeId, "up");
		incrementViews(db, jokeId);

		deleteJokeWithVotesAndStats(db, jokeId);

		expect(rowsFor(db, jokeId)).toEqual({
			jokes: { n: 0 },
			votes: { n: 0 },
			stats: { n: 0 },
		});
	});

	it("should delete a joke without votes and stats", () => {
		deleteJokeWithVotesAndStats(db, jokeId);

		expect(rowsFor(db, jokeId).jokes).toEqual({ n: 0 });
	});
});
