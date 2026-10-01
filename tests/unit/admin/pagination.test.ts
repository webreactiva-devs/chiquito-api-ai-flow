import { describe, expect, it } from "vitest";
import { paginate, parsePage } from "../../../src/admin/pagination.js";

describe("parsePage", () => {
	it.each([
		["2", 2],
		[undefined, 1],
		["abc", 1],
		["0", 1],
		["-3", 1],
		["1.5", 1],
		["1e19", 1],
		["9007199254740991", 9007199254740991],
	])("should read %s as page %i", (value, expected) => {
		expect(parsePage(value)).toBe(expected);
	});
});

describe("paginate", () => {
	it("should describe the first page", () => {
		expect(paginate(45, 1, 20)).toEqual({
			page: 1,
			pageCount: 3,
			total: 45,
			offset: 0,
			hasPrevious: false,
			hasNext: true,
		});
	});

	it("should describe a middle page", () => {
		expect(paginate(45, 2, 20)).toMatchObject({
			offset: 20,
			hasPrevious: true,
			hasNext: true,
		});
	});

	it("should describe the last page", () => {
		expect(paginate(45, 3, 20)).toMatchObject({
			offset: 40,
			hasPrevious: true,
			hasNext: false,
		});
	});

	it("should have one page when there are no jokes", () => {
		expect(paginate(0, 1, 20)).toMatchObject({ pageCount: 1, hasNext: false });
	});

	it("should keep a page after the last page", () => {
		expect(paginate(0, 4, 20)).toMatchObject({
			page: 4,
			pageCount: 1,
			hasPrevious: true,
			hasNext: false,
		});
	});
});
