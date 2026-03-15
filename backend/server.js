const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// ── Route imports ──────────────────────────────────────────────────────────────
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const taskRoutes = require("./routes/tasks");
const projectRoutes = require("./routes/projects");
const habitRoutes = require("./routes/habits");
const ideaRoutes = require("./routes/ideas");
const jobRoutes = require("./routes/jobs");
const learningRoutes = require("./routes/learning");
const journalRoutes = require("./routes/journal");
const activityRoutes = require("./routes/activity");
const budgetRoutes = require("./routes/budget");
const aiRoutes = require("./routes/ai");

// ── Bootstrap ──────────────────────────────────────────────────────────────────
dotenv.config();
connectDB();

const app = express();

// ── Global middleware ──────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ── Health check ───────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV, ts: new Date() });
});

// ── API routes ─────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/ideas", ideaRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/ai", aiRoutes);

// ── 404 handler ────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Centralised error handler ──────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(
    `\n🚀  SahilOS API running on http://localhost:${PORT}  [${process.env.NODE_ENV}]\n`
  );
});

// Graceful shutdown
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err.message);
  server.close(() => process.exit(1));
});

module.exports = app;
