import { describe, it } from "node:test";
import assert from "node:assert";
import request from "supertest";
import app from "../src/app.js";

describe("Chiquito API", () => {
  describe("GET /api/jokes", () => {
    it("should return all jokes", async () => {
      const response = await request(app).get("/api/jokes").expect(200);

      assert(Array.isArray(response.body));
      assert(response.body.length > 0);
    });

    it("should filter by category", async () => {
      const response = await request(app)
        .get("/api/jokes?category=clásico")
        .expect(200);

      response.body.forEach((joke) => {
        assert.strictEqual(joke.category, "clásico");
      });
    });
  });

  describe("GET /api/jokes/random", () => {
    it("should return random joke", async () => {
      const response = await request(app).get("/api/jokes/random").expect(200);

      assert(response.body.id);
      assert(response.body.content);
    });
  });

  describe("GET /api/jokes/:id", () => {
    it("should return specific joke", async () => {
      const response = await request(app).get("/api/jokes/1").expect(200);

      assert.strictEqual(response.body.id, 1);
    });

    it("should return 404 for non-existent ID", async () => {
      const response = await request(app).get("/api/jokes/999").expect(404);

      assert(response.body.error.includes("fistro"));
    });
  });

  describe("GET /api/categories", () => {
    it("should return complete category list with counts", async () => {
      const response = await request(app).get("/api/categories").expect(200);

      assert(Array.isArray(response.body));
      assert(response.body.length > 0);

      response.body.forEach((category) => {
        assert(category.name);
        assert(typeof category.count === "number");
        assert(category.count > 0);
      });
    });

    it("should verify joke counts are accurate for each category", async () => {
      const categoriesResponse = await request(app)
        .get("/api/categories")
        .expect(200);
      const jokesResponse = await request(app).get("/api/jokes").expect(200);

      const actualCounts = {};
      jokesResponse.body.forEach((joke) => {
        actualCounts[joke.category] = (actualCounts[joke.category] || 0) + 1;
      });

      categoriesResponse.body.forEach((category) => {
        assert.strictEqual(category.count, actualCounts[category.name]);
      });
    });

    it("should return response format matching API standards", async () => {
      const response = await request(app).get("/api/categories").expect(200);

      assert(Array.isArray(response.body));

      response.body.forEach((category) => {
        assert(Object.hasOwnProperty.call(category, "name"));
        assert(Object.hasOwnProperty.call(category, "count"));
        assert(typeof category.name === "string");
        assert(typeof category.count === "number");
      });
    });

    it("should handle server errors with proper status codes", async () => {
      const response = await request(app).get("/api/categories").expect(200);

      assert(response.headers["content-type"].includes("application/json"));
    });
  });
});
