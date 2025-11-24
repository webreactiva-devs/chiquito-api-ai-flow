import cors from "@fastify/cors";
import Fastify from "fastify";
import db from "./db/connection.js";
import { getAllJokes, getCategories, getJokeById, getJokesByCategory, getRandomJoke } from "./db/queries.js";

const app = Fastify({ logger: false });

await app.register(cors);

app.get("/api/categories", async () => {
  try {
    const categories = getCategories(db);
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
    return getJokesByCategory(db, category);
  }

  return getAllJokes(db);
});

app.get("/api/jokes/random", async () => {
  const randomJoke = getRandomJoke(db);
  return randomJoke;
});

app.get<{ Params: { id: string } }>("/api/jokes/:id", async (request, reply) => {
  const id = parseInt(request.params.id, 10);
  const joke = getJokeById(db, id);

  if (!joke) {
    return reply.status(404).send({ error: "Joke not found, fistro" });
  }

  return joke;
});

export default app;
