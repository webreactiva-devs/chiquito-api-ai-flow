import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { addVote, getVotesByJokeId, insertJokes } from "../../src/db/queries.js";
import { createTables, dropTables } from "../../src/db/schema.js";
import type { Joke } from "../../src/types/index.js";

const testJokes: Joke[] = [
  { id: 1, type: "phrase", content: "Test joke 1", category: "test" },
  { id: 2, type: "phrase", content: "Test joke 2", category: "test" },
];

describe("Vote Queries", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    createTables(db);
    insertJokes(db, testJokes);
  });

  afterEach(() => {
    db.close();
  });

  describe("addVote", () => {
    it("should add an upvote", () => {
      addVote(db, 1, "up");
      const votes = getVotesByJokeId(db, 1);
      expect(votes.upvotes).toBe(1);
      expect(votes.downvotes).toBe(0);
      expect(votes.score).toBe(1);
    });

    it("should add a downvote", () => {
      addVote(db, 1, "down");
      const votes = getVotesByJokeId(db, 1);
      expect(votes.upvotes).toBe(0);
      expect(votes.downvotes).toBe(1);
      expect(votes.score).toBe(-1);
    });

    it("should accumulate multiple votes", () => {
      addVote(db, 1, "up");
      addVote(db, 1, "up");
      addVote(db, 1, "down");
      const votes = getVotesByJokeId(db, 1);
      expect(votes.upvotes).toBe(2);
      expect(votes.downvotes).toBe(1);
      expect(votes.score).toBe(1);
    });
  });

  describe("getVotesByJokeId", () => {
    it("should return zero votes for joke without votes", () => {
      const votes = getVotesByJokeId(db, 1);
      expect(votes.upvotes).toBe(0);
      expect(votes.downvotes).toBe(0);
      expect(votes.score).toBe(0);
    });

    it("should return correct vote counts", () => {
      addVote(db, 1, "up");
      addVote(db, 1, "up");
      addVote(db, 1, "up");
      addVote(db, 1, "down");
      addVote(db, 1, "down");

      const votes = getVotesByJokeId(db, 1);
      expect(votes.upvotes).toBe(3);
      expect(votes.downvotes).toBe(2);
      expect(votes.score).toBe(1);
    });

    it("should track votes separately for different jokes", () => {
      addVote(db, 1, "up");
      addVote(db, 1, "up");
      addVote(db, 2, "down");

      const votes1 = getVotesByJokeId(db, 1);
      expect(votes1.upvotes).toBe(2);
      expect(votes1.score).toBe(2);

      const votes2 = getVotesByJokeId(db, 2);
      expect(votes2.downvotes).toBe(1);
      expect(votes2.score).toBe(-1);
    });
  });
});
