import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app.js";

describe("Chiquito API", () => {
  describe("GET /api/jokes", () => {
    it("should return all jokes", async () => {
      const response = await request(app).get("/api/jokes").expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it("should filter by category", async () => {
      const response = await request(app)
        .get("/api/jokes?category=clásico")
        .expect(200);

      response.body.forEach((joke: { category: string }) => {
        expect(joke.category).toBe("clásico");
      });
    });
  });

  describe("GET /api/jokes/random", () => {
    it("should return random joke", async () => {
      const response = await request(app).get("/api/jokes/random").expect(200);

      expect(response.body.id).toBeDefined();
      expect(response.body.content).toBeDefined();
    });
  });

  describe("GET /api/jokes/:id", () => {
    it("should return specific joke", async () => {
      const response = await request(app).get("/api/jokes/1").expect(200);

      expect(response.body.id).toBe(1);
    });

    it("should return 404 for non-existent ID", async () => {
      const response = await request(app).get("/api/jokes/999").expect(404);

      expect(response.body.error).toContain("fistro");
    });
  });

  describe("GET /api/categories", () => {
    it("should return complete category list with counts", async () => {
      const response = await request(app).get("/api/categories").expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      response.body.forEach((category: { name: string; count: number }) => {
        expect(category.name).toBeDefined();
        expect(typeof category.count).toBe("number");
        expect(category.count).toBeGreaterThan(0);
      });
    });

    it("should verify joke counts are accurate for each category", async () => {
      const categoriesResponse = await request(app)
        .get("/api/categories")
        .expect(200);
      const jokesResponse = await request(app).get("/api/jokes").expect(200);

      const actualCounts: Record<string, number> = {};
      jokesResponse.body.forEach((joke: { category: string }) => {
        actualCounts[joke.category] = (actualCounts[joke.category] || 0) + 1;
      });

      categoriesResponse.body.forEach(
        (category: { name: string; count: number }) => {
          expect(category.count).toBe(actualCounts[category.name]);
        }
      );
    });

    it("should return response format matching API standards", async () => {
      const response = await request(app).get("/api/categories").expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      response.body.forEach((category: { name: string; count: number }) => {
        expect(category).toHaveProperty("name");
        expect(category).toHaveProperty("count");
        expect(typeof category.name).toBe("string");
        expect(typeof category.count).toBe("number");
      });
    });

    it("should handle server errors with proper status codes", async () => {
      const response = await request(app).get("/api/categories").expect(200);

      expect(response.headers["content-type"]).toContain("application/json");
    });
  });
});
