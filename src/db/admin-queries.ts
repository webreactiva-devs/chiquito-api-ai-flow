import type Database from "better-sqlite3";
import type { Admin } from "../types/index.js";

export const createAdmin = (
	db: Database.Database,
	email: string,
	passwordHash: string,
): number => {
	const result = db
		.prepare("INSERT INTO admins (email, password_hash) VALUES (?, ?)")
		.run(email, passwordHash);
	return Number(result.lastInsertRowid);
};

export const findAdminByEmail = (
	db: Database.Database,
	email: string,
): Admin | undefined => {
	return db
		.prepare(
			"SELECT id, email, password_hash as passwordHash, created_at as createdAt FROM admins WHERE email = ?",
		)
		.get(email) as Admin | undefined;
};
