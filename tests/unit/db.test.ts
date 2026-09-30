import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	getAllJokes,
	getCategories,
	getJokeById,
	getJokesByCategory,
	getRandomJoke,
	insertJoke,
	insertJokes,
} from "../../src/db/queries.js";
import { createTables, dropTables } from "../../src/db/schema.js";
import type { Joke } from "../../src/types/index.js";

const testJokes: Joke[] = [
	{ id: 1, type: "phrase", content: "Test joke 1", category: "test" },
	{ id: 2, type: "phrase", content: "Test joke 2", category: "test" },
	{ id: 3, type: "phrase", content: "Test joke 3", category: "other" },
];

describe("Database Queries", () => {
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

	describe("getAllJokes", () => {
		it("should return all jokes", () => {
			const jokes = getAllJokes(db);
			expect(jokes).toHaveLength(3);
		});

		it("should return jokes with correct structure", () => {
			const jokes = getAllJokes(db);
			jokes.forEach((joke) => {
				expect(joke).toHaveProperty("id");
				expect(joke).toHaveProperty("type");
				expect(joke).toHaveProperty("content");
				expect(joke).toHaveProperty("category");
			});
		});
	});

	describe("getJokesByCategory", () => {
		it("should filter jokes by category", () => {
			const jokes = getJokesByCategory(db, "test");
			expect(jokes).toHaveLength(2);
			jokes.forEach((joke) => {
				expect(joke.category).toBe("test");
			});
		});

		it("should return empty array for non-existent category", () => {
			const jokes = getJokesByCategory(db, "nonexistent");
			expect(jokes).toHaveLength(0);
		});
	});

	describe("getJokeById", () => {
		it("should return joke by id", () => {
			const joke = getJokeById(db, 1);
			expect(joke).toBeDefined();
			expect(joke?.id).toBe(1);
			expect(joke?.content).toBe("Test joke 1");
		});

		it("should return undefined for non-existent id", () => {
			const joke = getJokeById(db, 999);
			expect(joke).toBeUndefined();
		});
	});

	describe("getRandomJoke", () => {
		it("should return a joke", () => {
			const joke = getRandomJoke(db);
			expect(joke).toBeDefined();
			expect(joke?.id).toBeDefined();
		});
	});

	describe("getCategories", () => {
		it("should return categories with counts", () => {
			const categories = getCategories(db);
			expect(categories).toHaveLength(2);

			const testCategory = categories.find((c) => c.name === "test");
			expect(testCategory?.count).toBe(2);

			const otherCategory = categories.find((c) => c.name === "other");
			expect(otherCategory?.count).toBe(1);
		});
	});

	describe("insertJoke", () => {
		it("should insert a single joke", () => {
			const newJoke: Joke = {
				id: 4,
				type: "phrase",
				content: "New joke",
				category: "new",
			};
			insertJoke(db, newJoke);

			const joke = getJokeById(db, 4);
			expect(joke).toBeDefined();
			expect(joke?.content).toBe("New joke");
		});
	});

	describe("schema", () => {
		it("should create and drop tables", () => {
			const newDb = new Database(":memory:");
			createTables(newDb);

			const tables = newDb
				.prepare("SELECT name FROM sqlite_master WHERE type='table'")
				.all();
			expect(tables).toContainEqual({ name: "jokes" });

			dropTables(newDb);
			const tablesAfter = newDb
				.prepare("SELECT name FROM sqlite_master WHERE type='table'")
				.all();
			expect(tablesAfter).not.toContainEqual({ name: "jokes" });

			newDb.close();
		});

		it("should keep admins and sessions when dropping joke tables", () => {
			dropTables(db);

			const tables = db
				.prepare("SELECT name FROM sqlite_master WHERE type='table'")
				.all();
			expect(tables).toContainEqual({ name: "admins" });
			expect(tables).toContainEqual({ name: "sessions" });
		});

		it("should delete the sessions of a deleted admin", () => {
			db.prepare(
				"INSERT INTO admins (id, email, password_hash) VALUES (1, 'ana@example.com', 'hash')",
			).run();
			db.prepare(
				"INSERT INTO sessions (id, admin_id, csrf_token, created_at, expires_at) VALUES ('sid', 1, 'token', 'now', 'later')",
			).run();

			db.prepare("DELETE FROM admins WHERE id = 1").run();

			const sessionCount = db
				.prepare("SELECT COUNT(*) as count FROM sessions")
				.get() as { count: number };
			expect(sessionCount.count).toBe(0);
		});
	});
});
