import { chmodSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Database, { type Database as DatabaseType } from "better-sqlite3";
import { registerSqlFunctions } from "./functions.js";
import { createTables } from "./schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath =
	process.env.DATABASE_PATH || join(__dirname, "../../data/chiquito.db");

const OWNER_READ_WRITE = 0o600;

const db: DatabaseType = new Database(dbPath);
if (dbPath !== ":memory:") {
	chmodSync(dbPath, OWNER_READ_WRITE);
}
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
registerSqlFunctions(db);
createTables(db);

export default db;

export const getDatabase = (path?: string): DatabaseType => {
	if (path === ":memory:") {
		const memDb = new Database(":memory:");
		memDb.pragma("foreign_keys = ON");
		registerSqlFunctions(memDb);
		return memDb;
	}
	return db;
};
