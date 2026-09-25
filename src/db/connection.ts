import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Database, { type Database as DatabaseType } from "better-sqlite3";
import { createTables } from "./schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath =
	process.env.DATABASE_PATH || join(__dirname, "../../data/chiquito.db");

const db: DatabaseType = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
createTables(db);

export default db;

export const getDatabase = (path?: string): DatabaseType => {
	if (path === ":memory:") {
		const memDb = new Database(":memory:");
		memDb.pragma("foreign_keys = ON");
		return memDb;
	}
	return db;
};
