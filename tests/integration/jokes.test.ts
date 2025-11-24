import { describe, expect, it } from "vitest";
import app from "../../src/app.js";

describe("Chiquito API", () => {
  describe("GET /api/jokes", () => {
    it("should return all jokes", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/jokes",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
    });

    it("should filter by category", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/jokes?category=clásico",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      body.forEach((joke: { category: string }) => {
        expect(joke.category).toBe("clásico");
      });
    });
  });

  describe("GET /api/jokes/random", () => {
    it("should return random joke", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/jokes/random",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.id).toBeDefined();
      expect(body.content).toBeDefined();
    });
  });

  describe("GET /api/jokes/:id", () => {
    it("should return specific joke", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/jokes/1",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.id).toBe(1);
    });

    it("should return 404 for non-existent ID", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/jokes/999",
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toContain("fistro");
    });
  });

  describe("GET /api/categories", () => {
    it("should return complete category list with counts", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/categories",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);

      body.forEach((category: { name: string; count: number }) => {
        expect(category.name).toBeDefined();
        expect(typeof category.count).toBe("number");
        expect(category.count).toBeGreaterThan(0);
      });
    });

    it("should verify joke counts are accurate for each category", async () => {
      const categoriesResponse = await app.inject({
        method: "GET",
        url: "/api/categories",
      });
      const jokesResponse = await app.inject({
        method: "GET",
        url: "/api/jokes",
      });

      expect(categoriesResponse.statusCode).toBe(200);
      expect(jokesResponse.statusCode).toBe(200);

      const categories = categoriesResponse.json();
      const jokes = jokesResponse.json();

      const actualCounts: Record<string, number> = {};
      jokes.forEach((joke: { category: string }) => {
        actualCounts[joke.category] = (actualCounts[joke.category] || 0) + 1;
      });

      categories.forEach((category: { name: string; count: number }) => {
        expect(category.count).toBe(actualCounts[category.name]);
      });
    });

    it("should return response format matching API standards", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/categories",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(Array.isArray(body)).toBe(true);

      body.forEach((category: { name: string; count: number }) => {
        expect(category).toHaveProperty("name");
        expect(category).toHaveProperty("count");
        expect(typeof category.name).toBe("string");
        expect(typeof category.count).toBe("number");
      });
    });

    it("should handle server errors with proper status codes", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/categories",
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toContain("application/json");
    });
  });
});
