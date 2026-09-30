import type { Writable } from "node:stream";
import { parseArgs } from "node:util";
import type Database from "better-sqlite3";
import { normalizeEmail } from "../admin/email.js";
import { findPasswordProblem, hashPassword } from "../admin/password.js";
import {
	changeAdminPassword,
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

interface CommandOptions {
	email?: string;
	"password-stdin"?: boolean;
}

type ExitCode = 0 | 1;

class CommandFailure extends Error {}

const readFirstLine = async (
	stream: NodeJS.ReadableStream,
): Promise<string> => {
	let text = "";
	for await (const chunk of stream) {
		text += chunk.toString();
	}
	return text.split(/\r?\n/)[0];
};

const askForNewPassword = async (io: CommandIo): Promise<string> => {
	if (!io.isInteractive) {
		throw new CommandFailure(
			"No interactive terminal. Use --password-stdin to give the password.",
		);
	}
	const password = await io.readHiddenLine("Password: ");
	const confirmation = await io.readHiddenLine("Repeat the password: ");
	if (password !== confirmation) {
		throw new CommandFailure("The passwords do not match.");
	}
	return password;
};

const readNewPasswordHash = async (
	options: CommandOptions,
	io: CommandIo,
): Promise<string> => {
	const password = options["password-stdin"]
		? await readFirstLine(io.stdin)
		: await askForNewPassword(io);
	const passwordProblem = findPasswordProblem(password);
	if (passwordProblem) {
		throw new CommandFailure(passwordProblem);
	}
	return hashPassword(password);
};

const requireEmail = (options: CommandOptions): string => {
	if (!options.email) {
		throw new CommandFailure("Missing --email, fistro.");
	}
	return normalizeEmail(options.email);
};

const createAdminCommand = async (
	options: CommandOptions,
	io: CommandIo,
	db: Database.Database,
): Promise<void> => {
	const email = requireEmail(options);
	if (findAdminByEmail(db, email)) {
		throw new CommandFailure(`An admin with email ${email} already exists.`);
	}
	const id = createAdmin(db, email, await readNewPasswordHash(options, io));
	io.stdout.write(`Admin created: ${email} (id ${id})\n`);
};

const listAdminsCommand = (io: CommandIo, db: Database.Database): void => {
	const admins = listAdmins(db);
	if (admins.length === 0) {
		io.stdout.write("No admins yet.\n");
	}
	for (const { id, email, createdAt } of admins) {
		io.stdout.write(`${id}\t${email}\t${createdAt}\n`);
	}
};

const deleteAdminCommand = (
	options: CommandOptions,
	io: CommandIo,
	db: Database.Database,
): void => {
	const email = requireEmail(options);
	if (!deleteAdminByEmail(db, email)) {
		throw new CommandFailure(`No admin with email ${email}.`);
	}
	io.stdout.write(`Admin deleted: ${email}. Their sessions are closed.\n`);
};

const changePasswordCommand = async (
	options: CommandOptions,
	io: CommandIo,
	db: Database.Database,
): Promise<void> => {
	const email = requireEmail(options);
	const admin = findAdminByEmail(db, email);
	if (!admin) {
		throw new CommandFailure(`No admin with email ${email}.`);
	}
	changeAdminPassword(db, admin.id, await readNewPasswordHash(options, io));
	io.stdout.write(`Password changed: ${email}. Their sessions are closed.\n`);
};

const COMMANDS: Record<
	string,
	(
		options: CommandOptions,
		io: CommandIo,
		db: Database.Database,
	) => void | Promise<void>
> = {
	create: createAdminCommand,
	list: (_options, io, db) => listAdminsCommand(io, db),
	delete: deleteAdminCommand,
	password: changePasswordCommand,
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

	const command = Object.hasOwn(COMMANDS, positionals[0] ?? "")
		? COMMANDS[positionals[0]]
		: undefined;
	if (!command) {
		io.stderr.write("Usage: admin <create|list|delete|password> [options]\n");
		return 1;
	}

	try {
		await command(values, io, db);
		return 0;
	} catch (error) {
		if (error instanceof CommandFailure) {
			io.stderr.write(`${error.message}\n`);
			return 1;
		}
		throw error;
	}
};
