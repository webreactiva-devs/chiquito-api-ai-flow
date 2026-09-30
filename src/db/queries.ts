import type Database from "better-sqlite3";
import type {
	Category,
	GlobalStats,
	Joke,
	JokeListFilters,
	JokeWithActivity,
	JokeWithStats,
	NewJoke,
	VoteResult,
	VoteType,
} from "../types/index.js";

export const getAllJokes = (db: Database.Database): Joke[] => {
	return db
		.prepare("SELECT id, type, content, category FROM jokes")
		.all() as Joke[];
};

export const getJokesByCategory = (
	db: Database.Database,
	category: string,
): Joke[] => {
	return db
		.prepare("SELECT id, type, content, category FROM jokes WHERE category = ?")
		.all(category) as Joke[];
};

export const getJokeById = (
	db: Database.Database,
	id: number,
): Joke | undefined => {
	return db
		.prepare("SELECT id, type, content, category FROM jokes WHERE id = ?")
		.get(id) as Joke | undefined;
};

export const getRandomJoke = (db: Database.Database): Joke | undefined => {
	return db
		.prepare(
			"SELECT id, type, content, category FROM jokes ORDER BY RANDOM() LIMIT 1",
		)
		.get() as Joke | undefined;
};

export const getCategories = (db: Database.Database): Category[] => {
	return db
		.prepare(`
    SELECT category as name, COUNT(*) as count
    FROM jokes
    GROUP BY category
  `)
		.all() as Category[];
};

export const insertJoke = (db: Database.Database, joke: Joke): void => {
	db.prepare(
		"INSERT INTO jokes (id, type, content, category) VALUES (?, ?, ?, ?)",
	).run(joke.id, joke.type, joke.content, joke.category);
};

export const createJoke = (db: Database.Database, joke: NewJoke): number => {
	const result = db
		.prepare("INSERT INTO jokes (type, content, category) VALUES (?, ?, ?)")
		.run(joke.type, joke.content, joke.category);
	return Number(result.lastInsertRowid);
};

export const insertJokes = (db: Database.Database, jokes: Joke[]): void => {
	const insert = db.prepare(
		"INSERT INTO jokes (id, type, content, category) VALUES (?, ?, ?, ?)",
	);
	const insertMany = db.transaction((jokes: Joke[]) => {
		for (const joke of jokes) {
			insert.run(joke.id, joke.type, joke.content, joke.category);
		}
	});
	insertMany(jokes);
};

export const addVote = (
	db: Database.Database,
	jokeId: number,
	voteType: VoteType,
): void => {
	db.prepare("INSERT INTO votes (joke_id, vote_type) VALUES (?, ?)").run(
		jokeId,
		voteType,
	);
};

export const getVotesByJokeId = (
	db: Database.Database,
	jokeId: number,
): VoteResult => {
	const result = db
		.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE 0 END), 0) as upvotes,
      COALESCE(SUM(CASE WHEN vote_type = 'down' THEN 1 ELSE 0 END), 0) as downvotes
    FROM votes
    WHERE joke_id = ?
  `)
		.get(jokeId) as { upvotes: number; downvotes: number };

	return {
		upvotes: result.upvotes,
		downvotes: result.downvotes,
		score: result.upvotes - result.downvotes,
	};
};

export const incrementViews = (db: Database.Database, jokeId: number): void => {
	db.prepare(`
    INSERT INTO stats (joke_id, views, last_viewed)
    VALUES (?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(joke_id) DO UPDATE SET
      views = views + 1,
      last_viewed = CURRENT_TIMESTAMP
  `).run(jokeId);
};

export const getViewsByJokeId = (
	db: Database.Database,
	jokeId: number,
): number => {
	const result = db
		.prepare("SELECT COALESCE(views, 0) as views FROM stats WHERE joke_id = ?")
		.get(jokeId) as { views: number } | undefined;
	return result?.views ?? 0;
};

export const getGlobalStats = (db: Database.Database): GlobalStats => {
	const totalJokes = (
		db.prepare("SELECT COUNT(*) as count FROM jokes").get() as { count: number }
	).count;
	const totalVotes = (
		db.prepare("SELECT COUNT(*) as count FROM votes").get() as { count: number }
	).count;
	const totalViews = (
		db.prepare("SELECT COALESCE(SUM(views), 0) as total FROM stats").get() as {
			total: number;
		}
	).total;

	return { totalJokes, totalVotes, totalViews };
};

export const getTopJokes = (
	db: Database.Database,
	by: "views" | "votes",
	limit: number,
): JokeWithStats[] => {
	if (by === "views") {
		return db
			.prepare(`
      SELECT
        j.id, j.type, j.content, j.category,
        COALESCE(s.views, 0) as views,
        COALESCE(SUM(CASE WHEN v.vote_type = 'up' THEN 1 ELSE 0 END), 0) as upvotes,
        COALESCE(SUM(CASE WHEN v.vote_type = 'down' THEN 1 ELSE 0 END), 0) as downvotes
      FROM jokes j
      LEFT JOIN stats s ON j.id = s.joke_id
      LEFT JOIN votes v ON j.id = v.joke_id
      GROUP BY j.id
      ORDER BY views DESC
      LIMIT ?
    `)
			.all(limit)
			.map((row: unknown) => {
				const r = row as {
					id: number;
					type: string;
					content: string;
					category: string;
					views: number;
					upvotes: number;
					downvotes: number;
				};
				return { ...r, score: r.upvotes - r.downvotes };
			}) as JokeWithStats[];
	}

	return db
		.prepare(`
    SELECT
      j.id, j.type, j.content, j.category,
      COALESCE(s.views, 0) as views,
      COALESCE(SUM(CASE WHEN v.vote_type = 'up' THEN 1 ELSE 0 END), 0) as upvotes,
      COALESCE(SUM(CASE WHEN v.vote_type = 'down' THEN 1 ELSE 0 END), 0) as downvotes
    FROM jokes j
    LEFT JOIN stats s ON j.id = s.joke_id
    LEFT JOIN votes v ON j.id = v.joke_id
    GROUP BY j.id
    ORDER BY (upvotes - downvotes) DESC
    LIMIT ?
  `)
		.all(limit)
		.map((row: unknown) => {
			const r = row as {
				id: number;
				type: string;
				content: string;
				category: string;
				views: number;
				upvotes: number;
				downvotes: number;
			};
			return { ...r, score: r.upvotes - r.downvotes };
		}) as JokeWithStats[];
};

export const updateJoke = (
	db: Database.Database,
	id: number,
	joke: NewJoke,
): void => {
	db.prepare(
		"UPDATE jokes SET type = ?, content = ?, category = ? WHERE id = ?",
	).run(joke.type, joke.content, joke.category, id);
};

export const getJokeDeleteImpact = (
	db: Database.Database,
	id: number,
): { votes: number; views: number } => {
	return db
		.prepare(`
    SELECT
      (SELECT COUNT(*) FROM votes WHERE joke_id = ?) as votes,
      COALESCE((SELECT views FROM stats WHERE joke_id = ?), 0) as views
  `)
		.get(id, id) as { votes: number; views: number };
};

export const deleteJokeWithVotesAndStats = (
	db: Database.Database,
	id: number,
): void => {
	db.transaction(() => {
		db.prepare("DELETE FROM votes WHERE joke_id = ?").run(id);
		db.prepare("DELETE FROM stats WHERE joke_id = ?").run(id);
		db.prepare("DELETE FROM jokes WHERE id = ?").run(id);
	})();
};

export const listJokesWithActivity = (
	db: Database.Database,
	{ category }: JokeListFilters = {},
): JokeWithActivity[] => {
	const conditions: string[] = [];
	const parameters: string[] = [];
	if (category) {
		conditions.push("j.category = ?");
		parameters.push(category);
	}
	const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

	return db
		.prepare(`
    SELECT
      j.id, j.type, j.content, j.category,
      (SELECT COUNT(*) FROM votes v WHERE v.joke_id = j.id AND v.vote_type = 'up') as upvotes,
      (SELECT COUNT(*) FROM votes v WHERE v.joke_id = j.id AND v.vote_type = 'down') as downvotes,
      COALESCE(s.views, 0) as views
    FROM jokes j
    LEFT JOIN stats s ON s.joke_id = j.id
    ${where}
    ORDER BY j.id
  `)
		.all(...parameters) as JokeWithActivity[];
};
