import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import cors from "@fastify/cors";
import Fastify from "fastify";
import type { Category, Joke } from "./types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = Fastify({ logger: false });

await app.register(cors);

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

app.get("/api/categories", async () => {
  try {
    const categories = buildCategoriesWithCount(jokes);
    return categories;
  } catch (_error) {
    throw { statusCode: 500, message: "Server error retrieving categories, fistro" };
  }
});

app.get("/health", async () => {
  return {
    status: "OK",
    message: "Fistro pecador de la pradera",
    timestamp: new Date().toISOString(),
  };
});

app.get<{ Querystring: { category?: string } }>("/api/jokes", async (request) => {
  const { category } = request.query;

  if (category) {
    const filteredJokes = jokes.filter((j) => j.category === category);
    return filteredJokes;
  }

  return jokes;
});

app.get("/api/jokes/random", async () => {
  const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
  return randomJoke;
});

app.get<{ Params: { id: string } }>("/api/jokes/:id", async (request, reply) => {
  const id = parseInt(request.params.id, 10);
  const joke = jokes.find((j) => j.id === id);

  if (!joke) {
    return reply.status(404).send({ error: "Joke not found, fistro" });
  }

  return joke;
});

export default app;
