import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	addVote,
	getGlobalStats,
	getTopJokes,
	getViewsByJokeId,
	incrementViews,
	insertJokes,
} from "../../src/db/queries.js";
import { createTables } from "../../src/db/schema.js";
import type { Joke } from "../../src/types/index.js";

const testJokes: Joke[] = [
	{ id: 1, type: "phrase", content: "Test joke 1", category: "test" },
	{ id: 2, type: "phrase", content: "Test joke 2", category: "test" },
	{ id: 3, type: "phrase", content: "Test joke 3", category: "other" },
];

describe("Stats Queries", () => {
	let db: Database.Database;

	beforeEach(() => {
		db = new Database(":memory:");
		db.pragma("foreign_keys = ON");
		createTables(db);
		insertJokes(db, testJokes);
	});

	afterEach(() => {
		db.close();
	});

	describe("incrementViews", () => {
		it("should increment views for a joke", () => {
			incrementViews(db, 1);
			const views = getViewsByJokeId(db, 1);
			expect(views).toBe(1);
		});

		it("should accumulate views", () => {
			incrementViews(db, 1);
			incrementViews(db, 1);
			incrementViews(db, 1);
			const views = getViewsByJokeId(db, 1);
			expect(views).toBe(3);
		});
	});

	describe("getViewsByJokeId", () => {
		it("should return 0 for joke without views", () => {
			const views = getViewsByJokeId(db, 1);
			expect(views).toBe(0);
		});
	});

	describe("getGlobalStats", () => {
		it("should return correct totals", () => {
			incrementViews(db, 1);
			incrementViews(db, 2);
			addVote(db, 1, "up");
			addVote(db, 1, "down");

			const stats = getGlobalStats(db);
			expect(stats.totalJokes).toBe(3);
			expect(stats.totalVotes).toBe(2);
			expect(stats.totalViews).toBe(2);
		});

		it("should return zeros for empty database", () => {
			const stats = getGlobalStats(db);
			expect(stats.totalJokes).toBe(3);
			expect(stats.totalVotes).toBe(0);
			expect(stats.totalViews).toBe(0);
		});
	});

	describe("getTopJokes", () => {
		it("should return top jokes by views", () => {
			incrementViews(db, 2);
			incrementViews(db, 2);
			incrementViews(db, 1);

			const top = getTopJokes(db, "views", 2);
			expect(top).toHaveLength(2);
			expect(top[0].id).toBe(2);
			expect(top[0].views).toBe(2);
		});

		it("should return top jokes by votes", () => {
			addVote(db, 3, "up");
			addVote(db, 3, "up");
			addVote(db, 1, "up");

			const top = getTopJokes(db, "votes", 2);
			expect(top).toHaveLength(2);
			expect(top[0].id).toBe(3);
			expect(top[0].score).toBe(2);
		});

		it("should respect limit parameter", () => {
			const top = getTopJokes(db, "views", 1);
			expect(top).toHaveLength(1);
		});
	});
});
