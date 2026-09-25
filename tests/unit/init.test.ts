import { readFileSync } from "node:fs";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the necessary modules
vi.mock("node:fs", async () => {
	const actual = await vi.importActual("node:fs");
	return {
		...actual,
		readFileSync: vi.fn().mockReturnValue(
			JSON.stringify({
				jokes: [
					{
						id: 1,
						type: "phrase",
						content: "Test joke 1",
						category: "test",
					},
					{
						id: 2,
						type: "phrase",
						content: "Test joke 2",
						category: "test",
					},
				],
			}),
		),
	};
});

vi.mock("node:path", async () => {
	const actual = await vi.importActual("node:path");
	return {
		...actual,
		join: vi.fn().mockReturnValue("/mock/path/chiquito.json"),
		dirname: vi.fn().mockReturnValue("/mock/path"),
	};
});

vi.mock("node:url", async () => {
	return {
		fileURLToPath: vi.fn().mockReturnValue("/mock/path"),
	};
});

// Mock console.log to prevent actual logging during tests
vi.spyOn(console, "log").mockImplementation(() => {});

describe("Database Initialization", () => {
	let originalEnv: typeof process.env;

	beforeEach(() => {
		originalEnv = process.env;
	});

	afterEach(() => {
		process.env = originalEnv;
		vi.clearAllMocks();
	});

	it("should initialize database with jokes from JSON file", async () => {
		// We need to test the initialization logic without running the full init script
		// since it executes immediately when imported

		// Import the necessary functions to test
		const { createTables, dropTables } = await import("../../src/db/schema.js");
		const { insertJokes, getAllJokes } = await import(
			"../../src/db/queries.js"
		);

		// Create an in-memory database for testing
		const db = new Database(":memory:");
		db.pragma("foreign_keys = ON");

		// Load test data
		const dataPath = "/mock/path/chiquito.json";
		const { jokes } = JSON.parse(readFileSync(dataPath, "utf8"));

		// Run initialization steps
		dropTables(db);
		createTables(db);
		insertJokes(db, jokes);

		// Verify jokes were inserted
		const allJokes = getAllJokes(db);
		expect(allJokes).toHaveLength(2);
		expect(allJokes[0].content).toBe("Test joke 1");
		expect(allJokes[1].content).toBe("Test joke 2");

		db.close();
	});
});
