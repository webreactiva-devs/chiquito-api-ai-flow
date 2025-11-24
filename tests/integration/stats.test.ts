import { describe, expect, it } from "vitest";
import app from "../../src/app.js";

describe("Stats API", () => {
	describe("GET /api/stats", () => {
		it("should return global statistics", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/api/stats",
			});

			expect(response.statusCode).toBe(200);
			const body = response.json();
			expect(typeof body.totalJokes).toBe("number");
			expect(typeof body.totalVotes).toBe("number");
			expect(typeof body.totalViews).toBe("number");
		});
	});

	describe("GET /api/stats/top", () => {
		it("should return top jokes by votes", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/api/stats/top?by=votes&limit=5",
			});

			expect(response.statusCode).toBe(200);
			const body = response.json();
			expect(Array.isArray(body)).toBe(true);
			expect(body.length).toBeLessThanOrEqual(5);

			if (body.length > 0) {
				expect(body[0]).toHaveProperty("id");
				expect(body[0]).toHaveProperty("score");
				expect(body[0]).toHaveProperty("views");
			}
		});

		it("should return top jokes by views", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/api/stats/top?by=views&limit=3",
			});

			expect(response.statusCode).toBe(200);
			const body = response.json();
			expect(Array.isArray(body)).toBe(true);
			expect(body.length).toBeLessThanOrEqual(3);
		});

		it("should default to votes sorting", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/api/stats/top",
			});

			expect(response.statusCode).toBe(200);
			const body = response.json();
			expect(Array.isArray(body)).toBe(true);
		});
	});

	describe("View tracking", () => {
		it("should increment views when getting a joke by id", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/api/jokes/1",
			});

			expect(response.statusCode).toBe(200);
			const body = response.json();
			expect(body.views).toBeGreaterThanOrEqual(1);
		});

		it("should include views in random joke response", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/api/jokes/random",
			});

			expect(response.statusCode).toBe(200);
			const body = response.json();
			expect(typeof body.views).toBe("number");
		});
	});
});
