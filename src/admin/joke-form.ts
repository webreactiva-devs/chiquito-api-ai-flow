import type { NewJoke } from "../types/index.js";

export const JOKE_TYPES = ["phrase", "joke"];
export const MAX_CONTENT_LENGTH = 1000;

export type JokeFormErrors = Partial<Record<keyof NewJoke, string>>;

export const countCharacters = (text: string): number => [...text].length;

export const validateJokeForm = (
	form: NewJoke,
): { joke: NewJoke; errors: JokeFormErrors } => {
	const joke = {
		type: form.type,
		category: form.category.trim(),
		content: form.content.trim(),
	};
	const errors: JokeFormErrors = {};

	if (!JOKE_TYPES.includes(joke.type)) {
		errors.type = "Type must be phrase or joke.";
	}
	if (!joke.category) {
		errors.category = "Category is required.";
	}
	if (!joke.content) {
		errors.content = "Content is required.";
	} else if (countCharacters(joke.content) > MAX_CONTENT_LENGTH) {
		errors.content = `Content must be ${MAX_CONTENT_LENGTH} characters or fewer.`;
	}

	return { joke, errors };
};
