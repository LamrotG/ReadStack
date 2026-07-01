import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { pool } from "./db/pool.js";
import authRouter from "./routes/auth.js";
import checkinsRouter from "./routes/checkins.js";
import goalsRouter from "./routes/goals.js";
import itemsRouter from "./routes/items.js";
import reviewsRouter from "./routes/reviews.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(503).json({ status: "error", db: "disconnected", message: err.message });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/items", reviewsRouter); // before itemsRouter so public GET reviews bypasses auth
app.use("/api/items", itemsRouter);
app.use("/api/goals", goalsRouter);
app.use("/api/checkins", checkinsRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "internal_error" });
});

const server = app.listen(PORT, () => {
  console.log(`ReadStack server listening on http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Kill the existing process or set a different PORT in .env.`);
    process.exit(1);
  }
  throw err;
});

process.on("SIGINT",  () => server.close(() => process.exit(0)));
process.on("SIGTERM", () => server.close(() => process.exit(0)));
