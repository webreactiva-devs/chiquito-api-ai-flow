import type Database from "better-sqlite3";

export const createTables = (db: Database.Database): void => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS jokes (
      id INTEGER PRIMARY KEY,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      joke_id INTEGER NOT NULL,
      vote_type TEXT CHECK(vote_type IN ('up', 'down')) NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (joke_id) REFERENCES jokes(id)
    );

    CREATE TABLE IF NOT EXISTS stats (
      joke_id INTEGER PRIMARY KEY,
      views INTEGER DEFAULT 0,
      last_viewed TEXT,
      FOREIGN KEY (joke_id) REFERENCES jokes(id)
    );
  `);
};

export const dropTables = (db: Database.Database): void => {
  db.exec(`
    DROP TABLE IF EXISTS stats;
    DROP TABLE IF EXISTS votes;
    DROP TABLE IF EXISTS jokes;
  `);
};
