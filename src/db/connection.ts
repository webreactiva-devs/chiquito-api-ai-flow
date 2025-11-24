import Database from "better-sqlite3";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DATABASE_PATH || join(__dirname, "../../data/chiquito.db");

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export default db;

export const getDatabase = (path?: string): Database.Database => {
  if (path === ":memory:") {
    const memDb = new Database(":memory:");
    memDb.pragma("foreign_keys = ON");
    return memDb;
  }
  return db;
};
