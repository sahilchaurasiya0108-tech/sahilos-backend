const Achievement = require("../models/Achievement");
const { ACHIEVEMENT_DEFINITIONS } = require("../models/Achievement");
const Task = require("../models/Task");
const Project = require("../models/Project");
const LearningItem = require("../models/LearningItem");
const JournalEntry = require("../models/JournalEntry");
const Habit = require("../models/Habit");
const Budget = require("../models/Budget");
const Knowledge = require("../models/Knowledge");
const Idea = require("../models/Idea");
const { logActivity } = require("./activityLogger");

const seedAchievements = async (userId) => {
  const existing = await Achievement.find({ userId }).select("key").lean();
  const existingKeys = new Set(existing.map((a) => a.key));
  const missing = ACHIEVEMENT_DEFINITIONS.filter((def) => !existingKeys.has(def.key));
  if (missing.length === 0) return;
  await Achievement.insertMany(
    missing.map((def) => ({ userId, ...def })),
    { ordered: false }
  );
};

const computeMetrics = async (userId) => {
  const [
    tasksCompleted,
    projectsDone,
    learningDone,
    habits,
    journalCount,
    budgetCount,
    knowledgeCount,
    ideasCount,
  ] = await Promise.all([
    Task.countDocuments({ userId, isDeleted: false, status: "done" }),
    Project.countDocuments({ userId, isDeleted: false, status: "completed" }),
    LearningItem.countDocuments({ userId, isDeleted: false, status: "completed" }),
    Habit.find({ userId, isDeleted: false }).select("currentStreak longestStreak").lean(),
    JournalEntry.countDocuments({ userId, isDeleted: false, content: { $ne: "" } }),
    Budget.countDocuments({ userId, isDeleted: false }),
    Knowledge.countDocuments({ userId, isDeleted: false }),
    Idea.countDocuments({ userId, isDeleted: false }),
  ]);

  const bestStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak || 0), 0);

  return {
    habit_streak:    bestStreak,
    tasks_completed: tasksCompleted,
    projects_done:   projectsDone,
    learning_done:   learningDone,
    journal_entries: journalCount,
    budget_count:    budgetCount,
    knowledge_count: knowledgeCount,
    ideas_count:     ideasCount,
  };
};

const evaluateAchievements = (userId) => {
  (async () => {
    try {
      await seedAchievements(userId);
      const metrics = await computeMetrics(userId);
      const locked = await Achievement.find({ userId, unlocked: false });

      for (const ach of locked) {
        const currentValue = metrics[ach.conditionType] ?? 0;
        if (currentValue >= ach.conditionValue) {
          ach.unlocked = true;
          ach.unlockedAt = new Date();
          await ach.save();

          logActivity(userId, "achievement_unlocked", ach._id, ach.title, { icon: ach.icon });

          try {
            const { notifyAchievementUnlocked } = require("./notificationService");
            notifyAchievementUnlocked(userId, ach.title, ach._id);
          } catch (_) {}
        }
      }
    } catch (err) {
      console.error("⚠️  Achievement evaluation failed:", err.message);
    }
  })();
};

module.exports = { evaluateAchievements, seedAchievements };
