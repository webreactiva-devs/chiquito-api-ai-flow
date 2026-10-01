import Database from "better-sqlite3";
import { registerSqlFunctions } from "../../src/db/functions.js";
import { createTables } from "../../src/db/schema.js";

export const createTestDatabase = (): Database.Database => {
	const db = new Database(":memory:");
	db.pragma("foreign_keys = ON");
	registerSqlFunctions(db);
	createTables(db);
	return db;
};
