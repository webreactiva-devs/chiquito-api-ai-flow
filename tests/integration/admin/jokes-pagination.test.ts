import { beforeAll, describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import db from "../../../src/db/connection.js";
import { countJokes, createJoke } from "../../../src/db/queries.js";
import { logInAsNewAdmin } from "../../helpers/admin.js";

const editedIds = (html: string): number[] =>
	[...html.matchAll(/href="\/admin\/jokes\/(\d+)\/edit"/g)].map(([, id]) =>
		Number(id),
	);

describe("Admin joke list pagination", () => {
	let cookie: string;

	const getList = (query: string) =>
		app.inject({
			method: "GET",
			url: `/admin/jokes${query}`,
			headers: { cookie },
		});

	beforeAll(async () => {
		({ cookie } = await logInAsNewAdmin());
	});

	it("should show all seed jokes on one page", async () => {
		const response = await getList("");

		expect(editedIds(response.body)).toHaveLength(17);
		expect(response.body).toContain("Page 1 of 1 (17 jokes)");
		expect(response.body).toContain(
			'<span class="btn btn-plain btn-sm btn-disabled" aria-disabled="true">« Previous</span>',
		);
		expect(response.body).toContain(
			'<span class="btn btn-plain btn-sm btn-disabled" aria-disabled="true">Next »</span>',
		);
	});

	it("should show 20 jokes on page 2 of 45", async () => {
		while (countJokes(db) < 45) {
			createJoke(db, { type: "joke", category: "absurdo", content: "¡Jarl!" });
		}

		const response = await getList("?page=2");

		expect(editedIds(response.body)).toEqual(
			Array.from({ length: 20 }, (_, index) => index + 21),
		);
		expect(response.body).toContain("Page 2 of 3 (45 jokes)");
		expect(response.body).toContain('href="/admin/jokes?page=1">« Previous');
		expect(response.body).toContain('href="/admin/jokes?page=3">Next »');
	});

	it("should keep the filters in the pagination links", async () => {
		const response = await getList("?category=absurdo&q=jarl&page=1");

		expect(response.body).toContain(
			'href="/admin/jokes?category=absurdo&amp;q=jarl&amp;page=2">Next »',
		);
	});

	it("should show page 1 for an invalid page", async () => {
		const response = await getList("?page=abc");

		expect(response.body).toContain("Page 1 of 3 (45 jokes)");
	});

	it("should show an empty state for a page without jokes", async () => {
		const response = await getList(`?category=familia&q=zzz&page=4`);

		expect(response.body).toContain("No jokes on this page.");
		expect(response.body).toContain(
			'href="/admin/jokes?category=familia&amp;q=zzz&amp;page=1"',
		);
		expect(response.body).toContain("Page 4 of 1 (0 jokes)");
		expect(response.body).not.toContain("<table");
	});
});
