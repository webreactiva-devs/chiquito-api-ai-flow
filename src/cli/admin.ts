import type { Writable } from "node:stream";
import { parseArgs } from "node:util";
import type Database from "better-sqlite3";
import { normalizeEmail } from "../admin/email.js";
import { findPasswordProblem, hashPassword } from "../admin/password.js";
import {
	createAdmin,
	deleteAdminByEmail,
	findAdminByEmail,
	listAdmins,
} from "../db/admin-queries.js";

export interface CommandIo {
	stdin: NodeJS.ReadableStream;
	stdout: Writable;
	stderr: Writable;
	isInteractive: boolean;
	readHiddenLine: (prompt: string) => Promise<string>;
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

const readNewPassword = async (
	usesStdin: boolean,
	io: CommandIo,
): Promise<string | undefined> => {
	if (usesStdin) {
		return readFirstLine(io.stdin);
	}
	if (!io.isInteractive) {
		io.stderr.write(
			"No interactive terminal. Use --password-stdin to give the password.\n",
		);
		return undefined;
	}
	const password = await io.readHiddenLine("Password: ");
	const confirmation = await io.readHiddenLine("Repeat the password: ");
	if (password !== confirmation) {
		io.stderr.write("The passwords do not match.\n");
		return undefined;
	}
	return password;
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

	const email = normalizeEmail(options.email);
	if (findAdminByEmail(db, email)) {
		io.stderr.write(`An admin with email ${email} already exists.\n`);
		return 1;
	}
	const password = await readNewPassword(
		options["password-stdin"] === true,
		io,
	);
	if (password === undefined) {
		return 1;
	}
	const passwordProblem = findPasswordProblem(password);
	if (passwordProblem) {
		io.stderr.write(`${passwordProblem}\n`);
		return 1;
	}
	const id = createAdmin(db, email, await hashPassword(password));
	io.stdout.write(`Admin created: ${email} (id ${id})\n`);
	return 0;
};

const deleteAdminCommand = (
	options: { email?: string },
	io: CommandIo,
	db: Database.Database,
): ExitCode => {
	if (!options.email) {
		io.stderr.write("Missing --email, fistro.\n");
		return 1;
	}
	const email = normalizeEmail(options.email);
	if (!deleteAdminByEmail(db, email)) {
		io.stderr.write(`No admin with email ${email}.\n`);
		return 1;
	}
	io.stdout.write(`Admin deleted: ${email}. Their sessions are closed.\n`);
	return 0;
};

const listAdminsCommand = (io: CommandIo, db: Database.Database): ExitCode => {
	const admins = listAdmins(db);
	if (admins.length === 0) {
		io.stdout.write("No admins yet.\n");
		return 0;
	}
	for (const { id, email, createdAt } of admins) {
		io.stdout.write(`${id}\t${email}\t${createdAt}\n`);
	}
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
	if (positionals[0] === "list") {
		return listAdminsCommand(io, db);
	}
	if (positionals[0] === "delete") {
		return deleteAdminCommand(values, io, db);
	}

	io.stderr.write("Usage: admin <create|list|delete> [options]\n");
	return 1;
};
