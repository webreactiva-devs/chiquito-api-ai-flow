import express from "express";
import cors from "cors";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const dataPath = join(__dirname, "../data/chiquito.json");
const { jokes } = JSON.parse(readFileSync(dataPath, "utf8"));

const buildCategoriesWithCount = (jokesData) => {
  const categoryCount = {};

  jokesData.forEach((joke) => {
    categoryCount[joke.category] = (categoryCount[joke.category] || 0) + 1;
  });

  return Object.entries(categoryCount).map(([name, count]) => ({
    name,
    count,
  }));
};

app.get("/api/categories", (req, res) => {
  try {
    const categories = buildCategoriesWithCount(jokes);
    res.json(categories);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Server error retrieving categories, fistro" });
  }
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Fistro pecador de la pradera",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/jokes", (req, res) => {
  const { category } = req.query;

  if (category) {
    const filteredJokes = jokes.filter((j) => j.category === category);
    return res.json(filteredJokes);
  }

  res.json(jokes);
});

app.get("/api/jokes/random", (req, res) => {
  const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
  res.json(randomJoke);
});

app.get("/api/jokes/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const joke = jokes.find((j) => j.id === id);

  if (!joke) {
    return res.status(404).json({ error: "Joke not found, fistro" });
  }

  res.json(joke);
});

export default app;
