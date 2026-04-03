const asyncHandler = require("../middleware/asyncHandler");
const JournalEntry = require("../models/JournalEntry");
const Task = require("../models/Task");
const HabitLog = require("../models/HabitLog");
const Habit = require("../models/Habit");
const Budget = require("../models/Budget");
const LearningItem = require("../models/LearningItem");
const { logActivity } = require("../utils/activityLogger");
const { evaluateAchievements } = require("../utils/achievementEngine");
const { getPagination } = require("../utils/pagination");

// ── Existing endpoints (unchanged) ────────────────────────────────────────────

const getEntries = asyncHandler(async (req, res) => {
  const { skip, limit, getPaginationMeta } = getPagination(req.query);
  const { mood, search } = req.query;

  const filter = { userId: req.user._id, isDeleted: false };
  if (mood) filter.mood = mood;
  if (search) filter.content = { $regex: search, $options: "i" };

  const [entries, total] = await Promise.all([
    JournalEntry.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
    JournalEntry.countDocuments(filter),
  ]);

  res.json({ success: true, pagination: getPaginationMeta(total), data: entries });
});

const getEntryByDate = asyncHandler(async (req, res) => {
  const entry = await JournalEntry.findOne({
    userId: req.user._id,
    date: req.params.date,
    isDeleted: false,
  }).lean();

  res.json({
    success: true,
    data: entry || { date: req.params.date, content: "", mood: "neutral", tags: [] },
  });
});

const upsertEntry = asyncHandler(async (req, res) => {
  const { date, content, mood, tags } = req.body;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.statusCode = 400;
    throw new Error("Date is required and must be in YYYY-MM-DD format");
  }

  const isNew = !(await JournalEntry.exists({
    userId: req.user._id, date, isDeleted: false,
  }));

  const entry = await JournalEntry.findOneAndUpdate(
    { userId: req.user._id, date },
    { $set: { content, mood, tags, isDeleted: false } },
    { new: true, upsert: true, runValidators: true }
  );

  if (isNew) {
    logActivity(req.user._id, "journal_written", entry._id, `Journal — ${date}`, { mood });

    // Celebrate first journal entry of the day
    try {
      const { createNotification } = require("../utils/notificationService");
      createNotification({
        userId: req.user._id,
        title: "📓 Journal entry saved",
        message: "Great — you showed up for yourself today. Keep the streak alive.",
        type: "info",
        category: "journal",
        actionLink: "/journal",
        metadata: { date, mood },
      });
    } catch (_) {}

    evaluateAchievements(req.user._id);
  }

  res.status(isNew ? 201 : 200).json({ success: true, data: entry });
});

const deleteEntry = asyncHandler(async (req, res) => {
  const entry = await JournalEntry.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!entry) { res.statusCode = 404; throw new Error("Journal entry not found"); }
  res.json({ success: true, message: "Journal entry deleted" });
});

// ── NEW: Day Insights ─────────────────────────────────────────────────────────
// GET /api/journal/insights/:date
// Returns tasks completed, habits logged, budget entries, learning updated for a day

const getDayInsights = asyncHandler(async (req, res) => {
  const { date } = req.params; // YYYY-MM-DD
  const userId = req.user._id;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.statusCode = 400;
    throw new Error("Date must be YYYY-MM-DD");
  }

  const dayStart = new Date(date + "T00:00:00.000Z");
  const dayEnd   = new Date(date + "T23:59:59.999Z");

  const [tasksCompleted, habitLogs, budgetEntries, learningItems] = await Promise.all([
    // Tasks that were updated (completed) on this day
    Task.find({
      userId,
      isDeleted: false,
      status: "done",
      updatedAt: { $gte: dayStart, $lte: dayEnd },
    }).select("title priority").lean(),

    // Habit completions on this day
    HabitLog.find({
      userId,
      completedDate: { $gte: dayStart, $lte: dayEnd },
    }).populate("habitId", "title icon color").lean(),

    // Budget entries on this day
    Budget.find({
      userId,
      isDeleted: false,
      date: { $gte: dayStart, $lte: dayEnd },
    }).select("title amount type category").lean(),

    // Learning items updated on this day
    LearningItem.find({
      userId,
      isDeleted: false,
      updatedAt: { $gte: dayStart, $lte: dayEnd },
    }).select("title progress status category").lean(),
  ]);

  res.json({
    success: true,
    data: {
      date,
      tasksCompleted,
      habitLogs: habitLogs.map((l) => ({
        habitTitle: l.habitId?.title || "Unknown",
        habitIcon:  l.habitId?.icon  || "⚡",
        habitColor: l.habitId?.color || "#10b981",
      })),
      budgetEntries,
      learningItems,
    },
  });
});

// ── NEW: AI Reflection ────────────────────────────────────────────────────────
// POST /api/journal/reflect
// Sends journal content to Groq, returns structured reflection

const reflectOnEntry = asyncHandler(async (req, res) => {
  const { content, date, mood } = req.body;

  if (!content || content.trim().length < 20) {
    res.statusCode = 400;
    throw new Error("Entry must be at least 20 characters to reflect on");
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.statusCode = 503;
    throw new Error("AI service not configured. Add GROQ_API_KEY to .env");
  }

  const prompt = `You are a thoughtful journaling coach. Analyze this journal entry and respond with ONLY valid JSON (no markdown, no backticks).

Journal entry (${date}, mood: ${mood}):
"${content.slice(0, 2000)}"

Respond with this exact JSON structure:
{
  "summary": "2-3 sentence summary of the entry",
  "emotionalTone": "one phrase describing the emotional tone",
  "insight": "one meaningful insight about what was written",
  "question": "one thoughtful reflective question to consider"
}`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 512,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    res.statusCode = 502;
    throw new Error(err?.error?.message || "AI reflection failed");
  }

  const aiData = await response.json();
  const raw = aiData?.choices?.[0]?.message?.content || "";

  // Parse JSON safely — AI occasionally wraps in backticks
  let reflection;
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    reflection = JSON.parse(cleaned);
  } catch {
    // Fallback if JSON parse fails
    reflection = {
      summary: raw.slice(0, 200),
      emotionalTone: "Reflective",
      insight: "Keep writing — patterns emerge over time.",
      question: "What felt most significant about today?",
    };
  }

  res.json({ success: true, data: reflection });
});

// ── NEW: Writing Streak ───────────────────────────────────────────────────────
// GET /api/journal/streak
// Returns current writing streak

const getWritingStreak = asyncHandler(async (req, res) => {
  const entries = await JournalEntry.find({
    userId: req.user._id,
    isDeleted: false,
    content: { $ne: "" },
  })
    .select("date")
    .sort({ date: -1 })
    .lean();

  if (!entries.length) {
    return res.json({ success: true, data: { streak: 0, totalEntries: 0 } });
  }

  const today = new Date().toISOString().slice(0, 10);
  const dates  = entries.map((e) => e.date);

  let streak = 0;
  let check  = today;

  for (let i = 0; i < 365; i++) {
    if (dates.includes(check)) {
      streak++;
      // Go back one day
      const d = new Date(check);
      d.setDate(d.getDate() - 1);
      check = d.toISOString().slice(0, 10);
    } else if (i === 0) {
      // Today has no entry yet — check yesterday before giving up
      const d = new Date(check);
      d.setDate(d.getDate() - 1);
      check = d.toISOString().slice(0, 10);
    } else {
      break;
    }
  }

  res.json({
    success: true,
    data: { streak, totalEntries: entries.length },
  });
});

// ── NEW: Mood trend (last 7 days) ─────────────────────────────────────────────
// GET /api/journal/mood-trend
const getMoodTrend = asyncHandler(async (req, res) => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const entries = await JournalEntry.find({
    userId: req.user._id,
    isDeleted: false,
    date: { $in: days },
  })
    .select("date mood")
    .lean();

  const map = {};
  entries.forEach((e) => { map[e.date] = e.mood; });

  const trend = days.map((date) => ({ date, mood: map[date] || null }));

  res.json({ success: true, data: trend });
});

module.exports = {
  getEntries,
  getEntryByDate,
  upsertEntry,
  deleteEntry,
  getDayInsights,
  reflectOnEntry,
  getWritingStreak,
  getMoodTrend,
};