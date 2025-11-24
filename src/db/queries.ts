import type Database from "better-sqlite3";
import type { Category, Joke } from "../types/index.js";

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
