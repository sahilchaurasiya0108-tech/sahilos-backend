const asyncHandler = require("../middleware/asyncHandler");
const Task = require("../models/Task");
const Project = require("../models/Project");
const Habit = require("../models/Habit");
const LearningItem = require("../models/LearningItem");
const JournalEntry = require("../models/JournalEntry");
const JobApplication = require("../models/JobApplication");
const Budget = require("../models/Budget");

// ── Context Builder ────────────────────────────────────────────────────────────
// Gathers a structured snapshot of the user's data to feed to the LLM.
// Intentionally limits fields & record counts — no raw DB dump.

const buildUserContext = async (userId) => {
  const now      = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    tasks,
    projects,
    habits,
    learningItems,
    recentJournal,
    jobs,
    budgetSummary,
  ] = await Promise.all([
    // Tasks — pending, last 20
    Task.find({ userId, isDeleted: false, status: { $ne: "done" } })
      .select("title priority status dueDate tags")
      .sort({ priority: -1, dueDate: 1 })
      .limit(20)
      .lean(),

    // Projects — active
    Project.find({ userId, isDeleted: false, status: "active" })
      .select("title progress status milestones")
      .limit(10)
      .lean(),

    // Habits — with streaks
    Habit.find({ userId, isDeleted: false })
      .select("title currentStreak longestStreak frequency")
      .limit(10)
      .lean(),

    // Learning — in progress
    LearningItem.find({ userId, isDeleted: false, status: { $in: ["in-progress", "not-started"] } })
      .select("title category progress status")
      .limit(10)
      .lean(),

    // Journal — last 7 entries
    JournalEntry.find({ userId, isDeleted: false })
      .select("date content mood")
      .sort({ date: -1 })
      .limit(7)
      .lean(),

    // Jobs — active pipeline
    JobApplication.find({ userId, isDeleted: false, stage: { $nin: ["rejected"] } })
      .select("company role stage followUpDate")
      .limit(15)
      .lean(),

    // Budget — this month's summary
    Budget.aggregate([
      {
        $match: {
          userId,
          isDeleted: false,
          date: { $gte: monthStart },
        },
      },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  // Format budget summary
  const income  = budgetSummary.find((r) => r._id === "income")?.total  || 0;
  const expense = budgetSummary.find((r) => r._id === "expense")?.total || 0;

  return {
    currentDate: todayStr,
    tasks: tasks.map((t) => ({
      title: t.title,
      priority: t.priority,
      status: t.status,
      dueDate: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : null,
      tags: t.tags,
    })),
    projects: projects.map((p) => ({
      title: p.title,
      progress: p.progress,
      milestonesTotal: p.milestones?.length || 0,
      milestonesDone: p.milestones?.filter((m) => m.done).length || 0,
    })),
    habits: habits.map((h) => ({
      title: h.title,
      currentStreak: h.currentStreak,
      longestStreak: h.longestStreak,
      frequency: h.frequency,
    })),
    learning: learningItems.map((l) => ({
      title: l.title,
      category: l.category,
      progress: l.progress,
      status: l.status,
    })),
    recentJournal: recentJournal.map((j) => ({
      date: j.date,
      mood: j.mood,
      excerpt: j.content ? j.content.slice(0, 300) : "",
    })),
    jobs: jobs.map((j) => ({
      company: j.company,
      role: j.role,
      stage: j.stage,
      followUpDate: j.followUpDate ? j.followUpDate.toISOString().slice(0, 10) : null,
    })),
    budget: {
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      income,
      expense,
      balance: income - expense,
    },
  };
};

// ── AI Query Controller ────────────────────────────────────────────────────────

/**
 * @desc    Answer a natural language question using user's portal data
 * @route   POST /api/ai/query
 * @access  Private
 */
const queryAI = asyncHandler(async (req, res) => {
  const { question } = req.body;

  if (!question || !question.trim()) {
    res.statusCode = 400;
    throw new Error("Question is required");
  }

  if (question.trim().length > 500) {
    res.statusCode = 400;
    throw new Error("Question cannot exceed 500 characters");
  }

  // Build context from user's real data
  const context = await buildUserContext(req.user._id);

  const systemPrompt = `You are SahilOS AI, a helpful personal assistant integrated into a life management app.
You have access to the user's current data snapshot below. Answer questions based ONLY on this data.
Be concise, specific, and helpful. Use bullet points for lists. If data is empty, say so honestly.
Never make up data. Today's date is ${context.currentDate}.

USER DATA SNAPSHOT:
${JSON.stringify(context, null, 2)}`;

  // Call Groq API — free Llama 3 (30 req/min, 6000 req/day, no credit card)
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    res.statusCode = 503;
    throw new Error(
      "AI service not configured. Add GROQ_API_KEY to your .env file. Get a free key at https://console.groq.com"
    );
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: question.trim() },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    res.statusCode = 502;
    throw new Error(err?.error?.message || "AI service request failed");
  }

  const aiData = await response.json();
  const answer = aiData?.choices?.[0]?.message?.content || "No response from AI.";

  res.json({
    success: true,
    data: {
      question: question.trim(),
      answer,
      contextSnapshot: {
        tasksCount: context.tasks.length,
        projectsCount: context.projects.length,
        habitsCount: context.habits.length,
        learningCount: context.learning.length,
        journalEntriesCount: context.recentJournal.length,
        jobsCount: context.jobs.length,
      },
    },
  });
});

/**
 * @desc    Get suggested questions based on user's current data
 * @route   GET /api/ai/suggestions
 * @access  Private
 */
const getSuggestions = asyncHandler(async (req, res) => {
  const suggestions = [
    "What are my pending high-priority tasks?",
    "How am I doing with my habits this week?",
    "What did I write in my journal yesterday?",
    "How much did I spend this month?",
    "What learning topics am I currently focusing on?",
    "Which job applications need a follow-up?",
    "What projects are almost complete?",
    "Give me a summary of my week.",
  ];

  res.json({ success: true, data: suggestions });
});

module.exports = { queryAI, getSuggestions };