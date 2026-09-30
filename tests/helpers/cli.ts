import { PassThrough, Readable } from "node:stream";
import Database from "better-sqlite3";
import type { CommandIo } from "../../src/cli/admin.js";
import { createTables } from "../../src/db/schema.js";

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

export const createTestDatabase = (): Database.Database => {
	const db = new Database(":memory:");
	db.pragma("foreign_keys = ON");
	createTables(db);
	return db;
};
