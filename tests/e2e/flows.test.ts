import { describe, expect, it } from "vitest";
import app from "../../src/app.js";

describe("E2E User Flows", () => {
	describe("User viewing and voting flow", () => {
		it("should allow user to view joke, vote, and verify stats update", async () => {
			const initialStats = await app.inject({
				method: "GET",
				url: "/api/stats",
			});
			expect(initialStats.statusCode).toBe(200);
			const initialStatsBody = initialStats.json();
			const initialViews = initialStatsBody.totalViews;
			const initialVotes = initialStatsBody.totalVotes;

			const jokeResponse = await app.inject({
				method: "GET",
				url: "/api/jokes/1",
			});
			expect(jokeResponse.statusCode).toBe(200);
			const joke = jokeResponse.json();
			expect(joke.id).toBe(1);
			expect(joke.views).toBeGreaterThanOrEqual(1);

			const voteResponse = await app.inject({
				method: "POST",
				url: "/api/jokes/1/vote",
				payload: { type: "up" },
			});
			expect(voteResponse.statusCode).toBe(200);
			const voteResult = voteResponse.json();
			expect(voteResult.upvotes).toBeGreaterThanOrEqual(1);

			const updatedStats = await app.inject({
				method: "GET",
				url: "/api/stats",
			});
			expect(updatedStats.statusCode).toBe(200);
			const updatedStatsBody = updatedStats.json();
			expect(updatedStatsBody.totalViews).toBeGreaterThan(initialViews);
			expect(updatedStatsBody.totalVotes).toBeGreaterThan(initialVotes);
		});
	});

	describe("Category browsing flow", () => {
		it("should allow user to browse categories and filter jokes", async () => {
			const categoriesResponse = await app.inject({
				method: "GET",
				url: "/api/categories",
			});
			expect(categoriesResponse.statusCode).toBe(200);
			const categories = categoriesResponse.json();
			expect(categories.length).toBeGreaterThan(0);

			const firstCategory = categories[0].name;

			const filteredJokes = await app.inject({
				method: "GET",
				url: `/api/jokes?category=${encodeURIComponent(firstCategory)}`,
			});
			expect(filteredJokes.statusCode).toBe(200);
			const jokes = filteredJokes.json();
			expect(jokes.length).toBe(categories[0].count);
			jokes.forEach((joke: { category: string }) => {
				expect(joke.category).toBe(firstCategory);
			});
		});
	});

	describe("Random joke flow", () => {
		it("should allow user to get random jokes and track views", async () => {
			const randomJoke1 = await app.inject({
				method: "GET",
				url: "/api/jokes/random",
			});
			expect(randomJoke1.statusCode).toBe(200);
			const joke1 = randomJoke1.json();
			expect(joke1.id).toBeDefined();
			expect(joke1.views).toBeGreaterThanOrEqual(1);

			const randomJoke2 = await app.inject({
				method: "GET",
				url: "/api/jokes/random",
			});
			expect(randomJoke2.statusCode).toBe(200);

			const stats = await app.inject({
				method: "GET",
				url: "/api/stats",
			});
			expect(stats.statusCode).toBe(200);
			const statsBody = stats.json();
			expect(statsBody.totalViews).toBeGreaterThanOrEqual(2);
		});
	});

	describe("Top jokes ranking flow", () => {
		it("should allow user to view top jokes by different criteria", async () => {
			await app.inject({
				method: "POST",
				url: "/api/jokes/3/vote",
				payload: { type: "up" },
			});
			await app.inject({
				method: "POST",
				url: "/api/jokes/3/vote",
				payload: { type: "up" },
			});

			const topByVotes = await app.inject({
				method: "GET",
				url: "/api/stats/top?by=votes&limit=5",
			});
			expect(topByVotes.statusCode).toBe(200);
			const voteRanking = topByVotes.json();
			expect(voteRanking.length).toBeLessThanOrEqual(5);

			if (voteRanking.length > 1) {
				expect(voteRanking[0].score).toBeGreaterThanOrEqual(
					voteRanking[1].score,
				);
			}

			await app.inject({
				method: "GET",
				url: "/api/jokes/5",
			});
			await app.inject({
				method: "GET",
				url: "/api/jokes/5",
			});

			const topByViews = await app.inject({
				method: "GET",
				url: "/api/stats/top?by=views&limit=5",
			});
			expect(topByViews.statusCode).toBe(200);
			const viewRanking = topByViews.json();
			expect(viewRanking.length).toBeLessThanOrEqual(5);
		});
	});

	describe("Health check flow", () => {
		it("should return healthy status", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/health",
			});

			expect(response.statusCode).toBe(200);
			const body = response.json();
			expect(body.status).toBe("OK");
			expect(body.timestamp).toBeDefined();
		});
	});
});
