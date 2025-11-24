import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express, { type Request, type Response } from "express";
import type { Category, Joke } from "./types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const dataPath = join(__dirname, "../data/chiquito.json");
const { jokes }: { jokes: Joke[] } = JSON.parse(readFileSync(dataPath, "utf8"));

const buildCategoriesWithCount = (jokesData: Joke[]): Category[] => {
	const categoryCount: Record<string, number> = {};

	jokesData.forEach((joke) => {
		categoryCount[joke.category] = (categoryCount[joke.category] || 0) + 1;
	});

	return Object.entries(categoryCount).map(([name, count]) => ({
		name,
		count,
	}));
};

app.get("/api/categories", (_req: Request, res: Response) => {
	try {
		const categories = buildCategoriesWithCount(jokes);
		res.json(categories);
	} catch (_error) {
		res
			.status(500)
			.json({ error: "Server error retrieving categories, fistro" });
	}
});

app.get("/health", (_req: Request, res: Response) => {
	res.json({
		status: "OK",
		message: "Fistro pecador de la pradera",
		timestamp: new Date().toISOString(),
	});
});

app.get("/api/jokes", (req: Request, res: Response) => {
	const { category } = req.query;

	if (category) {
		const filteredJokes = jokes.filter((j) => j.category === category);
		return res.json(filteredJokes);
	}

	res.json(jokes);
});

app.get("/api/jokes/random", (_req: Request, res: Response) => {
	const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
	res.json(randomJoke);
});

app.get("/api/jokes/:id", (req: Request, res: Response) => {
	const id = parseInt(req.params.id, 10);
	const joke = jokes.find((j) => j.id === id);

	if (!joke) {
		return res.status(404).json({ error: "Joke not found, fistro" });
	}

	res.json(joke);
});

export default app;
