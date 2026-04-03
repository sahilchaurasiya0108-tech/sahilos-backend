const asyncHandler = require("../middleware/asyncHandler");
const Task = require("../models/Task");
const Habit = require("../models/Habit");
const HabitLog = require("../models/HabitLog");
const JournalEntry = require("../models/JournalEntry");
const { logActivity } = require("../utils/activityLogger");
const { evaluateAchievements } = require("../utils/achievementEngine");
const { invalidateDashboardCache } = require("./dashboardController");
const { createNotification } = require("../utils/notificationService");

// ── Groq intent parser ─────────────────────────────────────────────────────────

async function parseIntent(transcript, userId) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  // Give Groq the user's current tasks + habits so it can resolve names
  const [tasks, habits] = await Promise.all([
    Task.find({ userId, isDeleted: false, status: { $ne: "done" } })
      .select("_id title")
      .limit(50)
      .lean(),
    Habit.find({ userId, isDeleted: false })
      .select("_id title")
      .limit(30)
      .lean(),
  ]);

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.APP_TIMEZONE || "Asia/Kolkata",
  }).format(new Date());

  const systemPrompt = `
You are Jarvis, a personal assistant integrated into SahilOS — a productivity app.
Today's date is ${today}.

The user's current tasks (id + title):
${tasks.map((t) => `  - id:${t._id}  "${t.title}"`).join("\n") || "  (none)"}

The user's current habits (id + title):
${habits.map((h) => `  - id:${h._id}  "${h.title}"`).join("\n") || "  (none)"}

Parse the user's voice command and return ONLY a JSON object. No explanation, no markdown, no code fences.

Supported actions and their JSON shapes:

1. create_task
   { "action": "create_task", "title": "...", "priority": "low|medium|high|urgent", "dueDate": "YYYY-MM-DD or null" }

2. complete_task
   { "action": "complete_task", "taskId": "<id from list above>", "taskTitle": "..." }
   (Match the task by name similarity. If ambiguous, pick the closest match.)

3. delete_task
   { "action": "delete_task", "taskId": "<id>", "taskTitle": "..." }

4. log_habit
   { "action": "log_habit", "habitId": "<id from list above>", "habitTitle": "..." }
   (e.g. "I did my morning run", "log gym", "mark meditation done")

5. add_journal
   { "action": "add_journal", "content": "...", "mood": "great|good|neutral|bad|awful" }
   (Transcribe the full journal content from what the user said)

6. query_dashboard
   { "action": "query_dashboard" }
   (e.g. "what's pending", "what do I have today", "what's on my plate")

7. set_reminder
   { "action": "set_reminder", "title": "...", "message": "...", "minutesFromNow": <number> }
   (e.g. "remind me to call mom in 30 minutes")

8. unknown
   { "action": "unknown", "transcript": "<original>" }
   (Use this if you genuinely cannot map to any action above)

Return ONLY the JSON. Nothing else.
`.trim();

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: transcript.trim() },
      ],
      max_tokens: 256,
      temperature: 0.1, // low temp = deterministic JSON
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Groq request failed");
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content || "{}";

  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch (_) {
    return { action: "unknown", transcript };
  }
}

// ── Action executor ────────────────────────────────────────────────────────────

async function executeIntent(intent, userId) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.APP_TIMEZONE || "Asia/Kolkata",
  }).format(new Date());

  switch (intent.action) {
    // ── Create task ────────────────────────────────────────────────────────────
    case "create_task": {
      const task = await Task.create({
        userId,
        title: intent.title,
        priority: intent.priority || "medium",
        dueDate: intent.dueDate || null,
        status: "todo",
      });
      logActivity(userId, "task_created", task._id, task.title);
      invalidateDashboardCache(userId);
      return {
        success: true,
        reply: `Got it. Task "${task.title}" added${intent.dueDate ? ` — due ${intent.dueDate}` : ""}.`,
        data: task,
      };
    }

    // ── Complete task ──────────────────────────────────────────────────────────
    case "complete_task": {
      const task = await Task.findOneAndUpdate(
        { _id: intent.taskId, userId, isDeleted: false },
        { status: "done" },
        { new: true }
      );
      if (!task) return { success: false, reply: `Couldn't find that task. Try again.` };
      logActivity(userId, "task_completed", task._id, task.title);
      evaluateAchievements(userId);
      invalidateDashboardCache(userId);
      return {
        success: true,
        reply: `Done. "${task.title}" marked as complete.`,
        data: task,
      };
    }

    // ── Delete task ────────────────────────────────────────────────────────────
    case "delete_task": {
      const task = await Task.findOneAndUpdate(
        { _id: intent.taskId, userId, isDeleted: false },
        { isDeleted: true },
        { new: true }
      );
      if (!task) return { success: false, reply: `Couldn't find that task.` };
      invalidateDashboardCache(userId);
      return {
        success: true,
        reply: `Task "${task.title}" deleted.`,
        data: task,
      };
    }

    // ── Log habit ──────────────────────────────────────────────────────────────
    case "log_habit": {
      const habit = await Habit.findOne({ _id: intent.habitId, userId, isDeleted: false });
      if (!habit) return { success: false, reply: `Couldn't find that habit.` };

      // Avoid duplicate log for today
      const existing = await HabitLog.findOne({ habitId: habit._id, date: today });
      if (existing) {
        return { success: true, reply: `"${habit.title}" already logged for today.` };
      }

      await HabitLog.create({ habitId: habit._id, userId, date: today, completed: true });

      // Update streak
      habit.currentStreak = (habit.currentStreak || 0) + 1;
      if (habit.currentStreak > (habit.longestStreak || 0)) {
        habit.longestStreak = habit.currentStreak;
      }
      await habit.save();

      logActivity(userId, "habit_completed", habit._id, habit.title);
      evaluateAchievements(userId);
      invalidateDashboardCache(userId);

      return {
        success: true,
        reply: `"${habit.title}" logged for today. Streak is now ${habit.currentStreak} days.`,
        data: habit,
      };
    }

    // ── Add journal ────────────────────────────────────────────────────────────
    case "add_journal": {
      // Upsert — if an entry already exists today, append to it
      const existing = await JournalEntry.findOne({ userId, date: today, isDeleted: false });
      let entry;
      if (existing) {
        existing.content = existing.content
          ? `${existing.content}\n\n${intent.content}`
          : intent.content;
        if (intent.mood) existing.mood = intent.mood;
        entry = await existing.save();
      } else {
        entry = await JournalEntry.create({
          userId,
          date: today,
          content: intent.content,
          mood: intent.mood || "neutral",
        });
      }
      logActivity(userId, "journal_created", entry._id, `Journal ${today}`);
      return {
        success: true,
        reply: `Journal entry saved for today.`,
        data: entry,
      };
    }

    // ── Query dashboard ────────────────────────────────────────────────────────
    case "query_dashboard": {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const [pendingTasks, habits, todayLogs] = await Promise.all([
        Task.find({
          userId,
          isDeleted: false,
          status: { $nin: ["done"] },
        })
          .select("title priority dueDate status")
          .sort({ dueDate: 1, priority: -1 })
          .limit(10)
          .lean(),

        Habit.find({ userId, isDeleted: false }).select("_id title currentStreak").lean(),

        HabitLog.find({ userId, date: today, completed: true }).select("habitId").lean(),
      ]);

      const completedHabitIds = new Set(todayLogs.map((l) => l.habitId.toString()));
      const pendingHabits = habits.filter((h) => !completedHabitIds.has(h._id.toString()));
      const overdue = pendingTasks.filter((t) => t.dueDate && new Date(t.dueDate) < now);
      const dueToday = pendingTasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= endOfDay
      );

      let reply = "";
      if (pendingTasks.length === 0 && pendingHabits.length === 0) {
        reply = "You're all caught up. Nothing pending today.";
      } else {
        const parts = [];
        if (overdue.length) parts.push(`${overdue.length} overdue task${overdue.length > 1 ? "s" : ""}: ${overdue.map((t) => t.title).join(", ")}`);
        if (dueToday.length) parts.push(`${dueToday.length} due today: ${dueToday.map((t) => t.title).join(", ")}`);
        if (pendingTasks.length - overdue.length - dueToday.length > 0) {
          parts.push(`${pendingTasks.length - overdue.length - dueToday.length} other open tasks`);
        }
        if (pendingHabits.length) parts.push(`${pendingHabits.length} habit${pendingHabits.length > 1 ? "s" : ""} not yet logged: ${pendingHabits.map((h) => h.title).join(", ")}`);
        reply = parts.join(". ") + ".";
      }

      return {
        success: true,
        reply,
        data: { pendingTasks, pendingHabits },
      };
    }

    // ── Set reminder ───────────────────────────────────────────────────────────
    case "set_reminder": {
      const fireAt = new Date(Date.now() + (intent.minutesFromNow || 30) * 60 * 1000);
      await createNotification({
        userId,
        title: `⏰ ${intent.title}`,
        message: intent.message || intent.title,
        type: "important",
        category: "system",
        scheduledFor: fireAt,
        sendPush: true,
      });
      const mins = intent.minutesFromNow || 30;
      return {
        success: true,
        reply: `Reminder set. I'll notify you in ${mins} minute${mins !== 1 ? "s" : ""}.`,
      };
    }

    // ── Unknown ────────────────────────────────────────────────────────────────
    default:
      return {
        success: false,
        reply: `I heard "${intent.transcript || "something"}" but I'm not sure what to do with that. Try: "add task", "complete task", "log habit", "what's pending", or "remind me in X minutes".`,
      };
  }
}

// ── Route handler ──────────────────────────────────────────────────────────────

/**
 * @desc  Process a Jarvis voice command
 * @route POST /api/jarvis
 * @body  { transcript: "Hey Jarvis, add task finish the report by Friday" }
 */
const handleJarvis = asyncHandler(async (req, res) => {
  const { transcript } = req.body;

  if (!transcript || !transcript.trim()) {
    res.statusCode = 400;
    throw new Error("transcript is required");
  }

  const userId = req.user._id;

  // 1. Parse intent via Groq
  const intent = await parseIntent(transcript.trim(), userId);

  // 2. Execute against the DB
  const result = await executeIntent(intent, userId);

  res.json({
    success: true,
    transcript: transcript.trim(),
    intent,
    reply: result.reply,
    data: result.data || null,
  });
});

module.exports = { handleJarvis };