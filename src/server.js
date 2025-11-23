// src/server.js
import app from "./app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🎭 Chiquito API running on port ${PORT}`);
  console.log(`📖 Documentation: http://localhost:${PORT}/api/jokes`);
});
