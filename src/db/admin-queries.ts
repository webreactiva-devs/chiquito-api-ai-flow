import type Database from "better-sqlite3";
import type { Admin, AdminSession } from "../types/index.js";

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

export const createSession = (
	db: Database.Database,
	session: Omit<AdminSession, "adminEmail">,
): void => {
	db.prepare(
		"INSERT INTO sessions (id, admin_id, csrf_token, created_at, expires_at) VALUES (?, ?, ?, ?, ?)",
	).run(
		session.id,
		session.adminId,
		session.csrfToken,
		session.createdAt,
		session.expiresAt,
	);
};

export const findSessionById = (
	db: Database.Database,
	id: string,
): AdminSession | undefined => {
	return db
		.prepare(`
    SELECT
      s.id, s.admin_id as adminId, a.email as adminEmail, s.csrf_token as csrfToken,
      s.created_at as createdAt, s.expires_at as expiresAt
    FROM sessions s
    JOIN admins a ON a.id = s.admin_id
    WHERE s.id = ?
  `)
		.get(id) as AdminSession | undefined;
};

export const deleteSession = (db: Database.Database, id: string): void => {
	db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
};
