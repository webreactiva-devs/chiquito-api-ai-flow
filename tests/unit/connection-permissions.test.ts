import { mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const fileMode = (path: string) => statSync(path).mode & 0o777;

describe("Database file permissions", () => {
	const directory = mkdtempSync(join(tmpdir(), "chiquito-db-"));

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.resetModules();
		rmSync(directory, { recursive: true, force: true });
	});

	it("should create the database, WAL and shared-memory files readable only by the owner", async () => {
		const databasePath = join(directory, "chiquito.db");
		vi.stubEnv("DATABASE_PATH", databasePath);
		vi.resetModules();

		const { default: db } = await import("../../src/db/connection.js");
		db.prepare(
			"INSERT INTO jokes (type, content, category) VALUES (?, ?, ?)",
		).run("phrase", "Fistro", "general");

		expect(fileMode(databasePath)).toBe(0o600);
		expect(fileMode(`${databasePath}-wal`)).toBe(0o600);
		expect(fileMode(`${databasePath}-shm`)).toBe(0o600);
		db.close();
	});
});
