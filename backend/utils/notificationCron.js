/**
 * Scheduled notification jobs using node-cron.
 * Call initCronJobs(app) from server.js after DB connects.
 *
 * Install: npm install node-cron
 */

let cron;
try {
  cron = require("node-cron");
} catch (_) {
  console.warn("⚠️  node-cron not installed — scheduled notifications disabled. Run: npm install node-cron");
}

const User = require("../models/User");
const Task = require("../models/Task");
const Habit = require("../models/Habit");
const HabitLog = require("../models/HabitLog");
const Notification = require("../models/Notification");
const { createNotification, notifyTaskDueSoon, notifyTaskOverdue, notifyHabitStreakDanger, notifyInactivity } = require("./notificationService");
const { generateFunNotification, generateTimeAwareFunNotification } = require("./notificationGenerator");

// ── Helpers ────────────────────────────────────────────────────────────────────

async function getAllUserIds() {
  const users = await User.find({}, "_id").lean();
  return users.map((u) => u._id);
}

// ── Job: Check tasks due soon (every hour) ────────────────────────────────────

async function checkTasksDueSoon() {
  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const tasks = await Task.find({
      dueDate: { $gte: now, $lte: in24h },
      status: { $ne: "completed" },
    }).lean();

    for (const task of tasks) {
      const hoursLeft = Math.round((new Date(task.dueDate) - now) / (1000 * 60 * 60));

      // Avoid duplicate notifications (check last 2h)
      const existing = await Notification.findOne({
        userId: task.userId,
        "metadata.taskId": String(task._id),
        category: "task",
        createdAt: { $gte: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
      });

      if (!existing) {
        await notifyTaskDueSoon(task.userId, task.title, task._id, hoursLeft);
      }
    }
  } catch (err) {
    console.error("Cron checkTasksDueSoon error:", err.message);
  }
}

// ── Job: Check overdue tasks (every 6h) ───────────────────────────────────────

async function checkOverdueTasks() {
  try {
    const now = new Date();
    const tasks = await Task.find({
      dueDate: { $lt: now },
      status: { $ne: "completed" },
    }).lean();

    for (const task of tasks) {
      const existing = await Notification.findOne({
        userId: task.userId,
        "metadata.taskId": String(task._id),
        category: "task",
        type: "important",
        createdAt: { $gte: new Date(now.getTime() - 6 * 60 * 60 * 1000) },
      });
      if (!existing) {
        const { notifyTaskOverdue } = require("./notificationService");
        await notifyTaskOverdue(task.userId, task.title, task._id);
      }
    }
  } catch (err) {
    console.error("Cron checkOverdueTasks error:", err.message);
  }
}

// ── Job: Habit streak danger check (daily at 8 PM) ────────────────────────────

async function checkHabitStreaks() {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const habits = await Habit.find({ isActive: true }).lean();

    for (const habit of habits) {
      // Check if already logged today
      const loggedToday = await HabitLog.findOne({
        habitId: habit._id,
        date: todayStr,
        completed: true,
      });

      if (!loggedToday && habit.currentStreak > 0) {
        const existing = await Notification.findOne({
          userId: habit.userId,
          "metadata.habitId": String(habit._id),
          category: "habit",
          createdAt: {
            $gte: new Date(now.getTime() - 20 * 60 * 60 * 1000),
          },
        });

        if (!existing) {
          await notifyHabitStreakDanger(
            habit.userId,
            habit.name,
            habit._id,
            habit.currentStreak
          );
        }
      }
    }
  } catch (err) {
    console.error("Cron checkHabitStreaks error:", err.message);
  }
}

// ── Job: Daily random fun notification (9 AM) ─────────────────────────────────

async function sendDailyFunNotification() {
  try {
    const userIds = await getAllUserIds();
    const fun = generateTimeAwareFunNotification();

    for (const userId of userIds) {
      await createNotification({
        userId,
        ...fun,
        sendPush: false,
      });
    }
    console.log(`✅ Daily fun notifications sent to ${userIds.length} users`);
  } catch (err) {
    console.error("Cron sendDailyFunNotification error:", err.message);
  }
}

// ── Job: Inactivity check (daily at 6 PM) ────────────────────────────────────

async function checkInactiveUsers() {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const users = await User.find({
      lastActiveAt: { $lt: cutoff },
    }, "_id").lean();

    for (const user of users) {
      const daysInactive = Math.floor(
        (Date.now() - new Date(user.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      // Don't spam — only send once per 24h
      const existing = await Notification.findOne({
        userId: user._id,
        category: "fun",
        createdAt: { $gte: cutoff },
      });
      if (!existing) {
        await notifyInactivity(user._id, daysInactive);
      }
    }
  } catch (err) {
    console.error("Cron checkInactiveUsers error:", err.message);
  }
}

// ── Job: Weekly productivity summary (Sunday 8 AM) ───────────────────────────

async function sendWeeklySummary() {
  try {
    const userIds = await getAllUserIds();
    for (const userId of userIds) {
      await createNotification({
        userId,
        title: "📊 Your weekly wrap",
        message: "Your weekly productivity report is ready. Brace yourself (or celebrate 🎉).",
        type: "info",
        category: "system",
        actionLink: "/dashboard",
        sendPush: false,
      });
    }
  } catch (err) {
    console.error("Cron sendWeeklySummary error:", err.message);
  }
}

// ── Job: Evening journal reminder (9 PM daily) ───────────────────────────────

async function sendJournalReminder() {
  try {
    const userIds = await getAllUserIds();
    const today = new Date().toISOString().split("T")[0];

    for (const userId of userIds) {
      // Skip if they already journaled today (optional check)
      await createNotification({
        userId,
        title: "📓 Evening reflection",
        message: "Take 5 minutes to journal. Your future self reads these.",
        type: "info",
        category: "journal",
        actionLink: "/journal",
        sendPush: false,
      });
    }
  } catch (err) {
    console.error("Cron sendJournalReminder error:", err.message);
  }
}

// ── Init ───────────────────────────────────────────────────────────────────────

function initCronJobs() {
  if (!cron) return;

  // Every hour — check tasks due soon
  cron.schedule("0 * * * *", checkTasksDueSoon);

  // Every 6 hours — check overdue tasks
  cron.schedule("0 */6 * * *", checkOverdueTasks);

  // Daily 8 PM — habit streak danger
  cron.schedule("0 20 * * *", checkHabitStreaks);

  // Daily 9 AM — fun notification
  cron.schedule("0 9 * * *", sendDailyFunNotification);

  // Daily 6 PM — inactivity check
  cron.schedule("0 18 * * *", checkInactiveUsers);

  // Daily 9 PM — journal reminder
  cron.schedule("0 21 * * *", sendJournalReminder);

  // Sunday 8 AM — weekly summary
  cron.schedule("0 8 * * 0", sendWeeklySummary);

  console.log("⏰ Notification cron jobs initialized");
}

module.exports = {
  initCronJobs,
  // Export individual jobs so they can be manually triggered via admin routes
  checkTasksDueSoon,
  checkOverdueTasks,
  checkHabitStreaks,
  sendDailyFunNotification,
  checkInactiveUsers,
  sendWeeklySummary,
  sendJournalReminder,
};
