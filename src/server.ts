import app from "./app.js";

const PORT = Number(process.env.PORT) || 3000;

const start = async () => {
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`Chiquito API running on port ${PORT}`);
    console.log(`Documentation: http://localhost:${PORT}/api/jokes`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
