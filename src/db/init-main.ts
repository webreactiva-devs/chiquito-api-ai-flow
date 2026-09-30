import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import type { Joke } from "../types/index.js";
import db from "./connection.js";
import { initializeDatabase } from "./init.js";

const { values } = parseArgs({ options: { force: { type: "boolean" } } });
const seedPath = join(import.meta.dirname, "../../data/chiquito.json");
const { jokes }: { jokes: Joke[] } = JSON.parse(readFileSync(seedPath, "utf8"));

if (initializeDatabase(db, jokes, { force: values.force ?? false })) {
	console.log(`Database initialized with ${jokes.length} jokes.`);
} else {
	console.error(
		"The database already has jokes. Use --force to reset jokes, votes and stats, fistro.",
	);
	process.exitCode = 1;
}

db.close();
