import type Database from "better-sqlite3";
import type { Joke } from "../types/index.js";
import { insertJokes } from "./queries.js";
import { createTables, dropTables } from "./schema.js";

const hasJokes = (db: Database.Database): boolean =>
	db.prepare("SELECT 1 FROM jokes LIMIT 1").get() !== undefined;

export const initializeDatabase = (
	db: Database.Database,
	jokes: Joke[],
	{ force }: { force: boolean },
): boolean => {
	createTables(db);
	if (hasJokes(db) && !force) {
		return false;
	}

	dropTables(db);
	createTables(db);
	insertJokes(db, jokes);
	return true;
};
