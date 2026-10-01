import type Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";
import { createAdmin } from "../../src/db/admin-queries.js";
import { initializeDatabase } from "../../src/db/init.js";
import { addVote, getAllJokes, incrementViews } from "../../src/db/queries.js";
import type { Joke } from "../../src/types/index.js";
import { createTestDatabase } from "../helpers/database.js";

const seedJokes: Joke[] = [
	{ id: 1, type: "phrase", content: "Test joke 1", category: "test" },
	{ id: 2, type: "phrase", content: "Test joke 2", category: "test" },
];

const count = (db: Database.Database, table: string): number =>
	(
		db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as {
			count: number;
		}
	).count;

describe("initializeDatabase", () => {
	let db: Database.Database;

	beforeEach(() => {
		db = createTestDatabase();
	});

	it("should seed an empty database", () => {
		expect(initializeDatabase(db, seedJokes, { force: false })).toBe(true);

		expect(getAllJokes(db)).toEqual(seedJokes);
	});

	it("should refuse a database with jokes without force", () => {
		initializeDatabase(db, seedJokes, { force: false });
		addVote(db, 1, "up");

		expect(initializeDatabase(db, [], { force: false })).toBe(false);

		expect(count(db, "jokes")).toBe(2);
		expect(count(db, "votes")).toBe(1);
	});

	it("should reset jokes, votes and stats but keep admins and sessions with force", () => {
		initializeDatabase(db, seedJokes, { force: false });
		addVote(db, 1, "up");
		incrementViews(db, 1);
		const adminId = createAdmin(db, "ana@example.com", "hash");
		db.prepare(
			"INSERT INTO sessions (id, admin_id, csrf_token, created_at, expires_at) VALUES ('sid', ?, 'token', 'now', 'later')",
		).run(adminId);

		expect(initializeDatabase(db, [seedJokes[0]], { force: true })).toBe(true);

		expect(getAllJokes(db)).toEqual([seedJokes[0]]);
		expect(count(db, "votes")).toBe(0);
		expect(count(db, "stats")).toBe(0);
		expect(count(db, "admins")).toBe(1);
		expect(count(db, "sessions")).toBe(1);
	});
});
