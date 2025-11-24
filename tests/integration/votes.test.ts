import { describe, expect, it } from "vitest";
import app from "../../src/app.js";

describe("Voting API", () => {
  describe("POST /api/jokes/:id/vote", () => {
    it("should register an upvote", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/jokes/1/vote",
        payload: { type: "up" },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.upvotes).toBeGreaterThanOrEqual(1);
      expect(typeof body.downvotes).toBe("number");
      expect(typeof body.score).toBe("number");
    });

    it("should register a downvote", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/jokes/2/vote",
        payload: { type: "down" },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.downvotes).toBeGreaterThanOrEqual(1);
    });

    it("should return 400 for invalid vote type", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/jokes/1/vote",
        payload: { type: "invalid" },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error).toContain("fistro");
    });

    it("should return 404 for non-existent joke", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/jokes/999/vote",
        payload: { type: "up" },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("GET /api/jokes/:id/votes", () => {
    it("should return vote counts for a joke", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/jokes/1/votes",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(typeof body.upvotes).toBe("number");
      expect(typeof body.downvotes).toBe("number");
      expect(typeof body.score).toBe("number");
    });

    it("should return 404 for non-existent joke", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/jokes/999/votes",
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("GET /api/jokes/:id with votes", () => {
    it("should include vote data in joke response", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/jokes/1",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.id).toBe(1);
      expect(typeof body.upvotes).toBe("number");
      expect(typeof body.downvotes).toBe("number");
      expect(typeof body.score).toBe("number");
    });
  });
});
