const asyncHandler = require("../middleware/asyncHandler");
const Task = require("../models/Task");
const Project = require("../models/Project");
const Habit = require("../models/Habit");
const LearningItem = require("../models/LearningItem");
const JournalEntry = require("../models/JournalEntry");
const JobApplication = require("../models/JobApplication");
const Budget = require("../models/Budget");
const Idea = require("../models/Idea");
const Knowledge = require("../models/Knowledge");
const LifeVision = require("../models/LifeVision");
const User = require("../models/User");

// ── Context Builder ────────────────────────────────────────────────────────────

const buildUserContext = async (userId) => {
  const now        = new Date();
  const todayStr   = now.toISOString().slice(0, 10);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    tasks, projects, habits, learningItems, recentJournal,
    jobs, budgetSummary, ideas, knowledge, lifeVision, user,
  ] = await Promise.all([
    Task.find({ userId, isDeleted: false, status: { $ne: "done" } })
      .select("title priority status dueDate tags")
      .sort({ priority: -1, dueDate: 1 })
      .limit(20).lean(),

    Project.find({ userId, isDeleted: false, status: "active" })
      .select("title progress status milestones")
      .limit(10).lean(),

    Habit.find({ userId, isDeleted: false })
      .select("title currentStreak longestStreak frequency")
      .limit(10).lean(),

    LearningItem.find({ userId, isDeleted: false, status: { $in: ["in-progress", "not-started"] } })
      .select("title category progress status")
      .limit(10).lean(),

    JournalEntry.find({ userId, isDeleted: false })
      .select("date content mood")
      .sort({ date: -1 })
      .limit(7).lean(),

    JobApplication.find({ userId, isDeleted: false, stage: { $nin: ["rejected"] } })
      .select("company role stage followUpDate")
      .limit(15).lean(),

    Budget.aggregate([
      { $match: { userId, isDeleted: false, date: { $gte: monthStart } } },
      { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),

    Idea.find({ userId, isDeleted: false })
      .select("title description status rating tags")
      .sort({ rating: -1, createdAt: -1 })
      .limit(15).lean(),

    Knowledge.find({ userId, isDeleted: false })
      .select("title category status author rating tags")
      .sort({ createdAt: -1 })
      .limit(15).lean(),

    LifeVision.findOne({ userId })
      .select("mission threeYearVision oneYearGoals currentFocus")
      .lean(),

    User.findById(userId).select("name email timezone createdAt").lean(),
  ]);

  const income  = budgetSummary.find((r) => r._id === "income")?.total  || 0;
  const expense = budgetSummary.find((r) => r._id === "expense")?.total || 0;

  return {
    currentDate: todayStr,
    userProfile: user ? {
      name: user.name,
      timezone: user.timezone,
      memberSince: user.createdAt ? user.createdAt.toISOString().slice(0, 10) : null,
    } : null,
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
    ideas: ideas.map((i) => ({
      title: i.title,
      description: i.description ? i.description.slice(0, 200) : "",
      status: i.status,
      rating: i.rating,
      tags: i.tags,
    })),
    knowledge: knowledge.map((k) => ({
      title: k.title,
      category: k.category,
      status: k.status,
      author: k.author || null,
      rating: k.rating || null,
    })),
    lifeVision: lifeVision ? {
      mission: lifeVision.mission || "",
      threeYearVision: lifeVision.threeYearVision || "",
      oneYearGoals: lifeVision.oneYearGoals || "",
      currentFocus: lifeVision.currentFocus || "",
    } : null,
  };
};

// ── AI Query ───────────────────────────────────────────────────────────────────

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

  const context = await buildUserContext(req.user._id);

  const systemPrompt = `You are SahilOS AI, a helpful personal assistant integrated into a life management app.
You have access to the user's current data snapshot below. Answer questions based ONLY on this data.
Be concise, specific, and helpful. Use bullet points for lists. If data is empty, say so honestly.
Never make up data. Today's date is ${context.currentDate}.
The user's name is ${context.userProfile?.name || "the user"}.

You have full visibility into the following areas of the user's life:
- Tasks (pending, priorities, due dates)
- Projects (active, progress, milestones)
- Habits (streaks, frequency)
- Learning (courses, books, skills in progress)
- Journal (recent entries with mood)
- Jobs (application pipeline, follow-ups)
- Budget (this month's income, expenses, balance)
- Ideas (idea vault with ratings and status)
- Knowledge (books, movies, quotes, articles saved)
- Life Vision (mission, 3-year vision, 1-year goals, current focus)

USER DATA SNAPSHOT:
${JSON.stringify(context, null, 2)}`;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.statusCode = 503;
    throw new Error("AI service not configured. Add GROQ_API_KEY to your .env file.");
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
        tasksCount:          context.tasks.length,
        projectsCount:       context.projects.length,
        habitsCount:         context.habits.length,
        learningCount:       context.learning.length,
        journalEntriesCount: context.recentJournal.length,
        jobsCount:           context.jobs.length,
        ideasCount:          context.ideas.length,
        knowledgeCount:      context.knowledge.length,
        hasLifeVision:       !!context.lifeVision,
      },
    },
  });
});

// ── Suggestions ────────────────────────────────────────────────────────────────

const getSuggestions = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [taskCount, habitCount, jobCount, journalCount, ideaCount, knowledgeCount, lifeVision, budgetCount] =
    await Promise.all([
      Task.countDocuments({ userId, isDeleted: false, status: { $ne: "done" } }),
      Habit.countDocuments({ userId, isDeleted: false }),
      JobApplication.countDocuments({ userId, isDeleted: false, stage: { $nin: ["rejected"] } }),
      JournalEntry.countDocuments({ userId, isDeleted: false }),
      Idea.countDocuments({ userId, isDeleted: false }),
      Knowledge.countDocuments({ userId, isDeleted: false }),
      LifeVision.findOne({ userId }).select("mission currentFocus").lean(),
      Budget.countDocuments({ userId, isDeleted: false }),
    ]);

  const suggestions = [];

  suggestions.push("Give me a summary of where I am right now.");
  if (taskCount > 0)     suggestions.push("What are my pending high-priority tasks?");
  if (habitCount > 0)    suggestions.push("How am I doing with my habits this week?");
  if (journalCount > 0)  suggestions.push("What did I write in my journal recently?");
  if (budgetCount > 0)   suggestions.push("How much did I spend this month?");
  if (jobCount > 0)      suggestions.push("Which job applications need a follow-up?");
  if (ideaCount > 0)     suggestions.push("What are my top-rated ideas?");
  if (knowledgeCount > 0) suggestions.push("What books or resources have I saved?");
  if (lifeVision?.mission || lifeVision?.currentFocus)
    suggestions.push("What is my current focus and mission?");
  suggestions.push("What projects are almost complete?");
  suggestions.push("What learning topics am I currently focusing on?");

  res.json({ success: true, data: suggestions.slice(0, 8) });
});

// ── Daily Quote ────────────────────────────────────────────────────────────────

const quoteCache = new Map(); // Map<userId, { date: string, quote: object }>

const getDailyQuote = asyncHandler(async (req, res) => {
  const userId   = String(req.user._id);
  const todayStr = new Date().toISOString().slice(0, 10);

  const cached = quoteCache.get(userId);
  if (cached && cached.date === todayStr) {
    return res.json({ success: true, data: cached.quote });
  }

  const userName  = req.user.name?.split(" ")[0] || "there";
  const hour      = new Date().getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const dayName   = new Date().toLocaleDateString("en-US", { weekday: "long" });

  const apiKey = process.env.GROQ_API_KEY;

  let quote = null;

  if (apiKey) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{
            role: "user",
            content: `Generate a short motivational quote for a developer/student named ${userName} on a ${dayName} ${timeOfDay}.
Return ONLY a JSON object: {"quote": "...", "author": "...", "vibe": "energetic|calm|focused|ambitious"}
Rules:
- Max 20 words
- Must feel fresh and specific — no clichés like "believe in yourself" or "every day is a new beginning"
- Real author if it fits, otherwise "Anonymous"
- No preamble, just the JSON`,
          }],
          max_tokens: 120,
          temperature: 1.0,
        }),
      });

      if (response.ok) {
        const data  = await response.json();
        const text  = data.choices?.[0]?.message?.content || "";
        const clean = text.replace(/```json|```/g, "").trim();
        quote = JSON.parse(clean);
      }
    } catch {
      quote = null;
    }
  }

  // Fallback pool — date-seeded so it never repeats on consecutive days
  if (!quote) {
    const fallbacks = [
      { quote: "Ship it. Iterate. Ship again.",                                    author: "Anonymous",        vibe: "energetic" },
      { quote: "The best debugger is a good night's sleep.",                       author: "Anonymous",        vibe: "calm"      },
      { quote: "Clarity of purpose beats intensity of effort.",                    author: "Anonymous",        vibe: "focused"   },
      { quote: "Done is better than perfect. Perfect is better than abandoned.",   author: "Anonymous",        vibe: "ambitious" },
      { quote: "Every system you build is a bet on the future.",                   author: "Anonymous",        vibe: "ambitious" },
      { quote: "Read the error message. Really read it.",                          author: "Anonymous",        vibe: "focused"   },
      { quote: "Consistency is just showing up when you don't feel like it.",      author: "Anonymous",        vibe: "energetic" },
      { quote: "Simplicity is the soul of efficiency.",                            author: "Austin Freeman",   vibe: "calm"      },
      { quote: "First, solve the problem. Then, write the code.",                  author: "John Johnson",     vibe: "focused"   },
      { quote: "Make it work, make it right, make it fast.",                       author: "Kent Beck",        vibe: "ambitious" },
      { quote: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius",      vibe: "calm"      },
      { quote: "An investment in knowledge pays the best interest.",               author: "Benjamin Franklin", vibe: "ambitious" },
      { quote: "Programs must be written for people to read, and only incidentally for machines.", author: "Harold Abelson", vibe: "focused" },
      { quote: "The most disastrous thing you can ever learn is your first programming language.", author: "Alan Kay",   vibe: "energetic" },
      { quote: "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.", author: "Antoine de Saint-Exupéry", vibe: "calm" },
      { quote: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar", vibe: "energetic" },
      { quote: "The only way to go fast is to go well.",                           author: "Robert C. Martin", vibe: "focused"   },
      { quote: "It's not about ideas. It's about making ideas happen.",            author: "Scott Belsky",     vibe: "ambitious" },
      { quote: "Stay hungry. Stay foolish.",                                       author: "Steve Jobs",       vibe: "energetic" },
      { quote: "Work hard in silence. Let success make the noise.",                author: "Anonymous",        vibe: "focused"   },
      { quote: "Small daily improvements over time lead to stunning results.",     author: "Anonymous",        vibe: "calm"      },
      { quote: "The secret of getting ahead is getting started.",                  author: "Mark Twain",       vibe: "energetic" },
      { quote: "Don't count the days. Make the days count.",                       author: "Muhammad Ali",     vibe: "ambitious" },
      { quote: "Discipline is the bridge between goals and accomplishment.",       author: "Jim Rohn",         vibe: "focused"   },
      { quote: "What you do today can improve all your tomorrows.",                author: "Ralph Marston",    vibe: "calm"      },
      { quote: "Code is like humor. When you have to explain it, it's bad.",       author: "Cory House",       vibe: "focused"   },
      { quote: "Simplicity is prerequisite for reliability.",                      author: "Edsger Dijkstra",  vibe: "calm"      },
      { quote: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb", vibe: "ambitious" },
    ];
    const seed  = todayStr.replace(/-/g, "");
    const index = parseInt(seed.slice(-6), 10) % fallbacks.length;
    quote = fallbacks[index];
  }

  quoteCache.set(userId, { date: todayStr, quote });
  res.json({ success: true, data: quote });
});

module.exports = { queryAI, getSuggestions, getDailyQuote };