import type Database from "better-sqlite3";

export const registerSqlFunctions = (db: Database.Database): void => {
	db.function("lower_text", { deterministic: true }, (value) =>
		String(value).toLowerCase(),
	);
};

export const escapeLikePattern = (text: string): string =>
	text.replace(/[\\%_]/g, "\\$&");
