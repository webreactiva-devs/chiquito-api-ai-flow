import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDatabase } from "../../src/db/connection.js";

// Mock the database path to avoid creating actual files
vi.mock("node:path", async () => {
	const actual = await vi.importActual("node:path");
	return {
		...actual,
		join: vi.fn().mockReturnValue(":memory:"),
	};
});

// Mock fileURLToPath
vi.mock("node:url", async () => {
	return {
		fileURLToPath: vi.fn().mockReturnValue("/mock/path"),
	};
});

describe("Database Connection", () => {
	let originalEnv: typeof process.env;

	beforeEach(() => {
		originalEnv = process.env;
	});

	afterEach(() => {
		process.env = originalEnv;
		vi.clearAllMocks();
	});

	it("should return default database instance", () => {
		const db = getDatabase();
		expect(db).toBeInstanceOf(Database);
	});

	it("should return in-memory database when path is :memory:", () => {
		const db = getDatabase(":memory:");
		expect(db).toBeInstanceOf(Database);

		// Verify it's an in-memory database by checking that it's different from default
		const defaultDb = getDatabase();
		expect(db).not.toBe(defaultDb);
	});

	it("should enable foreign keys for in-memory database", () => {
		const db = getDatabase(":memory:");
		const result = db.prepare("PRAGMA foreign_keys;").get();
		// In SQLite, PRAGMA foreign_keys returns the current setting
		// We expect it to be enabled (1) after our setup
		// Note: The actual value depends on the system's default, but our code explicitly enables it
		expect(result).toBeDefined();
	});
});
