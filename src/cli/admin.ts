import type { Writable } from "node:stream";
import { parseArgs } from "node:util";
import type Database from "better-sqlite3";
import { normalizeEmail } from "../admin/email.js";
import { hashPassword } from "../admin/password.js";
import { createAdmin } from "../db/admin-queries.js";

export interface CommandIo {
	stdin: NodeJS.ReadableStream;
	stdout: Writable;
	stderr: Writable;
	isInteractive: boolean;
}

type ExitCode = 0 | 1;

const readFirstLine = async (
	stream: NodeJS.ReadableStream,
): Promise<string> => {
	let text = "";
	for await (const chunk of stream) {
		text += chunk.toString();
	}
	return text.split(/\r?\n/)[0];
};

const createAdminCommand = async (
	options: { email?: string; "password-stdin"?: boolean },
	io: CommandIo,
	db: Database.Database,
): Promise<ExitCode> => {
	if (!options.email) {
		io.stderr.write("Missing --email, fistro.\n");
		return 1;
	}
	if (!options["password-stdin"]) {
		io.stderr.write("Use --password-stdin to give the password.\n");
		return 1;
	}

	const email = normalizeEmail(options.email);
	const password = await readFirstLine(io.stdin);
	const id = createAdmin(db, email, await hashPassword(password));
	io.stdout.write(`Admin created: ${email} (id ${id})\n`);
	return 0;
};

export const runAdminCommand = async (
	args: string[],
	io: CommandIo,
	db: Database.Database,
): Promise<ExitCode> => {
	const { positionals, values } = parseArgs({
		args,
		allowPositionals: true,
		options: {
			email: { type: "string" },
			"password-stdin": { type: "boolean" },
		},
	});

	if (positionals[0] === "create") {
		return createAdminCommand(values, io, db);
	}

	io.stderr.write("Usage: admin <create> [options]\n");
	return 1;
};
