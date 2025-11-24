import type Database from "better-sqlite3";

export const createTables = (db: Database.Database): void => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS jokes (
      id INTEGER PRIMARY KEY,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL
    );
  `);
};

export const dropTables = (db: Database.Database): void => {
  db.exec(`DROP TABLE IF EXISTS jokes;`);
};
