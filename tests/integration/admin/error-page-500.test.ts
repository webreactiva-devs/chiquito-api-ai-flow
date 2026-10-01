import { describe, expect, it, vi } from "vitest";
import app from "../../../src/app.js";
import { listJokesWithActivity } from "../../../src/db/queries.js";
import { logInAsNewAdmin } from "../../helpers/admin.js";

vi.mock("../../../src/db/queries.js", async (importOriginal) => {
	const original =
		await importOriginal<typeof import("../../../src/db/queries.js")>();
	return { ...original, listJokesWithActivity: vi.fn() };
});

describe("Admin unexpected error page", () => {
	it("should show an HTML 500 page without internal details", async () => {
		const { cookie } = await logInAsNewAdmin();
		vi.mocked(listJokesWithActivity).mockImplementation(() => {
			throw Object.assign(new Error("datatype mismatch"), {
				code: "SQLITE_MISMATCH",
			});
		});

		const response = await app.inject({
			method: "GET",
			url: "/admin/jokes",
			headers: { cookie },
		});

		expect(response.statusCode).toBe(500);
		expect(response.headers["content-type"]).toContain("text/html");
		expect(response.body).toContain("Something went wrong");
		expect(response.body).not.toContain("SQLITE_MISMATCH");
		expect(response.body).not.toContain("datatype mismatch");
	});
});
