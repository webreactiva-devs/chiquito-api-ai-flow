import { describe, expect, it } from "vitest";
import { validateJokeForm } from "../../../src/admin/joke-form.js";

const validForm = { type: "joke", category: "absurdo", content: "¡Jarl!" };

describe("validateJokeForm", () => {
	it("should accept a valid form and trim the text fields", () => {
		const result = validateJokeForm({
			type: "phrase",
			category: "  clásico ",
			content: " ¡Fistro! ",
		});

		expect(result).toEqual({
			joke: { type: "phrase", category: "clásico", content: "¡Fistro!" },
			errors: {},
		});
	});

	it("should reject a type that is not phrase or joke", () => {
		expect(validateJokeForm({ ...validForm, type: "limerick" }).errors).toEqual(
			{ type: "Type must be phrase or joke." },
		);
	});

	it.each(["", "   "])("should require a category (%j)", (category) => {
		expect(validateJokeForm({ ...validForm, category }).errors).toEqual({
			category: "Category is required.",
		});
	});

	it.each(["", "   "])("should require content (%j)", (content) => {
		expect(validateJokeForm({ ...validForm, content }).errors).toEqual({
			content: "Content is required.",
		});
	});

	it("should accept 1000 characters and reject 1001", () => {
		expect(
			validateJokeForm({ ...validForm, content: "a".repeat(1000) }).errors,
		).toEqual({});
		expect(
			validateJokeForm({ ...validForm, content: "a".repeat(1001) }).errors,
		).toEqual({ content: "Content must be 1000 characters or fewer." });
	});

	it("should count an emoji as one character", () => {
		expect(
			validateJokeForm({ ...validForm, content: "😂".repeat(1000) }).errors,
		).toEqual({});
	});
});
