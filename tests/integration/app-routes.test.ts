import type Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import sharedDb from "../../src/db/connection.js";
import { insertJokes } from "../../src/db/queries.js";
import { createTables, dropTables } from "../../src/db/schema.js";
import type { Joke } from "../../src/types/index.js";

const testJokes: Joke[] = [
	{ id: 1, type: "phrase", content: "Test joke 1", category: "test" },
	{ id: 2, type: "phrase", content: "Test joke 2", category: "test" },
	{ id: 3, type: "phrase", content: "Test joke 3", category: "other" },
];

describe("App API Routes", () => {
	let db: Database.Database;

	beforeEach(() => {
		db = sharedDb;
		dropTables(db);
		createTables(db);
		insertJokes(db, testJokes);
	});

	describe("GET /api/categories", () => {
		it("should return categories successfully", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/api/categories",
			});

			expect(response.statusCode).toBe(200);
			const body = response.json();
			expect(Array.isArray(body)).toBe(true);
			expect(body.length).toBeGreaterThan(0);
		});
	});

	describe("GET /api/jokes", () => {
		it("should return all jokes without category filter", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/api/jokes",
			});

			expect(response.statusCode).toBe(200);
			const body = response.json();
			expect(Array.isArray(body)).toBe(true);
			expect(body.length).toBe(3);
		});

		it("should filter jokes by category", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/api/jokes?category=test",
			});

			expect(response.statusCode).toBe(200);
			const body = response.json();
			expect(Array.isArray(body)).toBe(true);
			expect(body.length).toBe(2);
			body.forEach((joke: Joke) => {
				expect(joke.category).toBe("test");
			});
		});
	});

	describe("GET /api/jokes/random", () => {
		it("should return null when no jokes exist", async () => {
			dropTables(db);
			createTables(db);

			const response = await app.inject({
				method: "GET",
				url: "/api/jokes/random",
			});

			expect(response.statusCode).toBe(200);
			expect(response.body).toBe("");
		});
	});

	describe("GET /api/jokes/:id", () => {
		it("should return 404 for non-existent ID with string id", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/api/jokes/abc",
			});

			// This should return 404 since 'abc' will be parsed as NaN and then to 0
			expect(response.statusCode).toBe(404);
			const body = response.json();
			expect(body.error).toContain("fistro");
		});

		it("should return joke with stats", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/api/jokes/1",
			});

			expect(response.statusCode).toBe(200);
			const body = response.json();
			expect(body.id).toBe(1);
			expect(body.views).toBeDefined();
			expect(body.upvotes).toBeDefined();
			expect(body.downvotes).toBeDefined();
			expect(body.score).toBeDefined();
		});
	});

	describe("POST /api/jokes/:id/vote", () => {
		it("should return 400 for invalid vote type", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/api/jokes/1/vote",
				payload: { type: "invalid" },
			});

			expect(response.statusCode).toBe(400);
			const body = response.json();
			expect(body.error).toContain("fistro");
		});

		it("should return 400 for missing vote type", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/api/jokes/1/vote",
				payload: {},
			});

			expect(response.statusCode).toBe(400);
			const body = response.json();
			expect(body.error).toContain("fistro");
		});

		it("should return 404 for non-existent joke when voting", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/api/jokes/999/vote",
				payload: { type: "up" },
			});

			expect(response.statusCode).toBe(404);
			const body = response.json();
			expect(body.error).toContain("fistro");
		});

		it("should handle valid votes", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/api/jokes/1/vote",
				payload: { type: "up" },
			});

			expect(response.statusCode).toBe(200);
			const body = response.json();
			expect(body.upvotes).toBeGreaterThanOrEqual(0);
			expect(body.downvotes).toBeGreaterThanOrEqual(0);
			expect(body.score).toBeDefined();
		});
	});

	describe("GET /api/jokes/:id/votes", () => {
		it("should return 404 for non-existent joke when getting votes", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/api/jokes/999/votes",
			});

			expect(response.statusCode).toBe(404);
			const body = response.json();
			expect(body.error).toContain("fistro");
		});

		it("should return votes for existing joke", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/api/jokes/1/votes",
			});

			expect(response.statusCode).toBe(200);
			const body = response.json();
			expect(body.upvotes).toBeGreaterThanOrEqual(0);
			expect(body.downvotes).toBeGreaterThanOrEqual(0);
			expect(body.score).toBeDefined();
		});
	});

	describe("GET /api/stats/top", () => {
		it("should return top jokes by views with default limit", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/api/stats/top",
			});

			expect(response.statusCode).toBe(200);
			const body = response.json();
			expect(Array.isArray(body)).toBe(true);
			expect(body.length).toBeLessThanOrEqual(10); // Default limit is 10
		});

		it("should return top jokes by views with custom limit", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/api/stats/top?by=views&limit=2",
			});

			expect(response.statusCode).toBe(200);
			const body = response.json();
			expect(Array.isArray(body)).toBe(true);
			expect(body.length).toBeLessThanOrEqual(2);
		});

		it("should return top jokes by votes with custom limit", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/api/stats/top?by=votes&limit=1",
			});

			expect(response.statusCode).toBe(200);
			const body = response.json();
			expect(Array.isArray(body)).toBe(true);
			expect(body.length).toBeLessThanOrEqual(1);
		});

		it("should handle invalid by parameter and default to votes", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/api/stats/top?by=invalid&limit=5",
			});

			expect(response.statusCode).toBe(200);
			const body = response.json();
			expect(Array.isArray(body)).toBe(true);
			expect(body.length).toBeLessThanOrEqual(5);
		});
	});

	describe("GET /health", () => {
		it("should return health status with valid format", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/health",
			});

			expect(response.statusCode).toBe(200);
			const body = response.json();
			expect(body.status).toBe("OK");
			expect(body.message).toContain("pecador"); // The actual message contains "pecador de la pradera"
			expect(body.timestamp).toBeDefined();
			expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp); // Validate ISO string
		});
	});
});
