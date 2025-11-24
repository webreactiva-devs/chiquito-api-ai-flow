import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Joke } from "../types/index.js";
import db from "./connection.js";
import { insertJokes } from "./queries.js";
import { createTables, dropTables } from "./schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataPath = join(__dirname, "../../data/chiquito.json");
const { jokes }: { jokes: Joke[] } = JSON.parse(readFileSync(dataPath, "utf8"));

console.log("Initializing database...");

dropTables(db);
createTables(db);

console.log(`Inserting ${jokes.length} jokes...`);
insertJokes(db, jokes);

console.log("Database initialized successfully!");
console.log(`Total jokes: ${jokes.length}`);

db.close();
