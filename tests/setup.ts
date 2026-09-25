import { readFileSync } from "node:fs";
import { join } from "node:path";
import db from "../src/db/connection.js";
import { insertJokes } from "../src/db/queries.js";
import type { Joke } from "../src/types/index.js";

const seedPath = join(import.meta.dirname, "../data/chiquito.json");
const { jokes }: { jokes: Joke[] } = JSON.parse(readFileSync(seedPath, "utf8"));

insertJokes(db, jokes);
