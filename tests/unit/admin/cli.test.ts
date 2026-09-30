import type Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";
import { verifyPassword } from "../../../src/admin/password.js";
import { runAdminCommand } from "../../../src/cli/admin.js";
import { findAdminByEmail } from "../../../src/db/admin-queries.js";
import { createFakeIo, createTestDatabase } from "../../helpers/cli.js";

describe("admin CLI", () => {
	let db: Database.Database;

	beforeEach(() => {
		db = createTestDatabase();
	});

	describe("create", () => {
		it("should create an admin with a lowercase email from stdin password", async () => {
			const io = createFakeIo("a-long-password-1\n");

			const exitCode = await runAdminCommand(
				["create", "--email", " Ana@Example.com ", "--password-stdin"],
				io,
				db,
			);

			expect(exitCode).toBe(0);
			const admin = findAdminByEmail(db, "ana@example.com");
			expect(admin).toBeDefined();
			expect(admin?.passwordHash).not.toContain("a-long-password-1");
			expect(
				await verifyPassword("a-long-password-1", admin?.passwordHash ?? ""),
			).toBe(true);
			expect(io.output()).toContain("Admin created: ana@example.com");
		});

		it("should fail without an email", async () => {
			const io = createFakeIo("a-long-password-1\n");

			const exitCode = await runAdminCommand(
				["create", "--password-stdin"],
				io,
				db,
			);

			expect(exitCode).toBe(1);
			expect(io.errors()).toContain("--email");
		});
	});

	it("should fail with an unknown command", async () => {
		const io = createFakeIo("");

		const exitCode = await runAdminCommand(["dance"], io, db);

		expect(exitCode).toBe(1);
		expect(io.errors()).toContain("Usage");
	});
});
