import { PassThrough, Readable } from "node:stream";
import type { CommandIo } from "../../src/cli/admin.js";

export interface FakeIo extends CommandIo {
	output: () => string;
	errors: () => string;
}

const collect = (stream: PassThrough): (() => string) => {
	let text = "";
	stream.on("data", (chunk) => {
		text += chunk.toString();
	});
	return () => text;
};

export const createFakeIo = (
	input: string,
	{ isInteractive = false } = {},
): FakeIo => {
	const stdout = new PassThrough();
	const stderr = new PassThrough();
	return {
		stdin: Readable.from([input]),
		stdout,
		stderr,
		isInteractive,
		output: collect(stdout),
		errors: collect(stderr),
	};
};
