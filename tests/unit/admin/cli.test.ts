import type Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";
import { verifyPassword } from "../../../src/admin/password.js";
import { runAdminCommand } from "../../../src/cli/admin.js";
import { findAdminByEmail } from "../../../src/db/admin-queries.js";
import { createFakeIo } from "../../helpers/cli.js";
import { createTestDatabase } from "../../helpers/database.js";

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

		it("should refuse a short password and create no admin", async () => {
			const io = createFakeIo("short\n");

			const exitCode = await runAdminCommand(
				["create", "--email", "ana@example.com", "--password-stdin"],
				io,
				db,
			);

			expect(exitCode).toBe(1);
			expect(io.errors()).toContain("12 to 128 characters");
			expect(findAdminByEmail(db, "ana@example.com")).toBeUndefined();
		});

		it("should refuse an email that exists in any letter case", async () => {
			await runAdminCommand(
				["create", "--email", "ana@example.com", "--password-stdin"],
				createFakeIo("a-long-password-1\n"),
				db,
			);
			const io = createFakeIo("a-long-password-2\n");

			const exitCode = await runAdminCommand(
				["create", "--email", "ANA@example.com", "--password-stdin"],
				io,
				db,
			);

			expect(exitCode).toBe(1);
			expect(io.errors()).toContain("already exists");
			expect(db.prepare("SELECT COUNT(*) as count FROM admins").get()).toEqual({
				count: 1,
			});
		});

		it("should ask for the password two times in a terminal", async () => {
			const io = createFakeIo("", {
				isInteractive: true,
				hiddenAnswers: ["a-long-password-1", "a-long-password-1"],
			});

			const exitCode = await runAdminCommand(
				["create", "--email", "bea@example.com"],
				io,
				db,
			);

			expect(exitCode).toBe(0);
			expect(io.output()).toContain("Password: Repeat the password: ");
			expect(findAdminByEmail(db, "bea@example.com")).toBeDefined();
		});

		it("should refuse two different passwords", async () => {
			const io = createFakeIo("", {
				isInteractive: true,
				hiddenAnswers: ["a-long-password-1", "a-long-password-2"],
			});

			const exitCode = await runAdminCommand(
				["create", "--email", "bea@example.com"],
				io,
				db,
			);

			expect(exitCode).toBe(1);
			expect(io.errors()).toContain("The passwords do not match.");
			expect(findAdminByEmail(db, "bea@example.com")).toBeUndefined();
		});

		it("should ask for --password-stdin without a terminal", async () => {
			const io = createFakeIo("a-long-password-1\n");

			const exitCode = await runAdminCommand(
				["create", "--email", "bea@example.com"],
				io,
				db,
			);

			expect(exitCode).toBe(1);
			expect(io.errors()).toContain("Use --password-stdin");
			expect(findAdminByEmail(db, "bea@example.com")).toBeUndefined();
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
