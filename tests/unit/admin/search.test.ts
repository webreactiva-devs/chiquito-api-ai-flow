import type Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";
import { escapeLikePattern } from "../../../src/db/functions.js";
import { createJoke, listJokesWithActivity } from "../../../src/db/queries.js";
import { createTestDatabase } from "../../helpers/database.js";

describe("escapeLikePattern", () => {
	it.each([
		["100%", "100\\%"],
		["a_b", "a\\_b"],
		["back\\slash", "back\\\\slash"],
		["¡Jarl!", "¡Jarl!"],
	])("should escape %s", (text, expected) => {
		expect(escapeLikePattern(text)).toBe(expected);
	});
});

describe("listJokesWithActivity search", () => {
	let db: Database.Database;

	const contents = (search: string, category?: string) =>
		listJokesWithActivity(db, { search, category }).map(
			({ content }) => content,
		);

	beforeEach(() => {
		db = createTestDatabase();
		createJoke(db, {
			type: "joke",
			category: "absurdo",
			content: "¿Cuándo es él?",
		});
		createJoke(db, {
			type: "phrase",
			category: "clásico",
			content: "¡Fistro duodenal!",
		});
		createJoke(db, {
			type: "phrase",
			category: "absurdo",
			content: "Un fistro al 100% de_verdad",
		});
	});

	it("should ignore case for accented letters", () => {
		expect(contents("ÉL")).toEqual(["¿Cuándo es él?"]);
		expect(contents("CUÁNDO")).toEqual(["¿Cuándo es él?"]);
	});

	it("should not ignore accents", () => {
		expect(contents("cuando")).toEqual([]);
	});

	it("should treat % and _ as literal characters", () => {
		expect(contents("%")).toEqual(["Un fistro al 100% de_verdad"]);
		expect(contents("_")).toEqual(["Un fistro al 100% de_verdad"]);
	});

	it("should combine the search with the category", () => {
		expect(contents("FISTRO", "clásico")).toEqual(["¡Fistro duodenal!"]);
	});
});
