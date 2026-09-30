import Database from "better-sqlite3";
import { createTables } from "../../src/db/schema.js";

export const createTestDatabase = (): Database.Database => {
	const db = new Database(":memory:");
	db.pragma("foreign_keys = ON");
	createTables(db);
	return db;
};
