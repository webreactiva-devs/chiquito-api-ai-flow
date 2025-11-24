import type Database from "better-sqlite3";
import type { Category, Joke, VoteResult, VoteType } from "../types/index.js";

export const getAllJokes = (db: Database.Database): Joke[] => {
  return db.prepare("SELECT id, type, content, category FROM jokes").all() as Joke[];
};

export const getJokesByCategory = (db: Database.Database, category: string): Joke[] => {
  return db.prepare("SELECT id, type, content, category FROM jokes WHERE category = ?").all(category) as Joke[];
};

export const getJokeById = (db: Database.Database, id: number): Joke | undefined => {
  return db.prepare("SELECT id, type, content, category FROM jokes WHERE id = ?").get(id) as Joke | undefined;
};

export const getRandomJoke = (db: Database.Database): Joke | undefined => {
  return db.prepare("SELECT id, type, content, category FROM jokes ORDER BY RANDOM() LIMIT 1").get() as Joke | undefined;
};

export const getCategories = (db: Database.Database): Category[] => {
  return db.prepare(`
    SELECT category as name, COUNT(*) as count
    FROM jokes
    GROUP BY category
  `).all() as Category[];
};

export const insertJoke = (db: Database.Database, joke: Joke): void => {
  db.prepare("INSERT INTO jokes (id, type, content, category) VALUES (?, ?, ?, ?)").run(
    joke.id,
    joke.type,
    joke.content,
    joke.category
  );
};

export const insertJokes = (db: Database.Database, jokes: Joke[]): void => {
  const insert = db.prepare("INSERT INTO jokes (id, type, content, category) VALUES (?, ?, ?, ?)");
  const insertMany = db.transaction((jokes: Joke[]) => {
    for (const joke of jokes) {
      insert.run(joke.id, joke.type, joke.content, joke.category);
    }
  });
  insertMany(jokes);
};

export const addVote = (db: Database.Database, jokeId: number, voteType: VoteType): void => {
  db.prepare("INSERT INTO votes (joke_id, vote_type) VALUES (?, ?)").run(jokeId, voteType);
};

export const getVotesByJokeId = (db: Database.Database, jokeId: number): VoteResult => {
  const result = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE 0 END), 0) as upvotes,
      COALESCE(SUM(CASE WHEN vote_type = 'down' THEN 1 ELSE 0 END), 0) as downvotes
    FROM votes
    WHERE joke_id = ?
  `).get(jokeId) as { upvotes: number; downvotes: number };

  return {
    upvotes: result.upvotes,
    downvotes: result.downvotes,
    score: result.upvotes - result.downvotes,
  };
};
