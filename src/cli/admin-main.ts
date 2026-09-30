import db from "../db/connection.js";
import { runAdminCommand } from "./admin.js";
import { readHiddenLine } from "./terminal.js";

process.exitCode = await runAdminCommand(
	process.argv.slice(2),
	{
		stdin: process.stdin,
		stdout: process.stdout,
		stderr: process.stderr,
		isInteractive: process.stdin.isTTY === true,
		readHiddenLine,
	},
	db,
);
