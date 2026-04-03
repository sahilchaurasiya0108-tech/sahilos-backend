/**
 * Scheduled notification jobs using node-cron.
 * Call initCronJobs() from server.js after DB connects.
 *
 * All cron schedules run in IST (Asia/Kolkata) by default.
 * Override via env: APP_TIMEZONE=Asia/Kolkata
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
const {
  createNotification,
  notifyTaskDueSoon,
  notifyTaskOverdue,
  notifyHabitStreakDanger,
  notifyInactivity,
} = require("./notificationService");
const {
  generateFunNotification,
  generateTimeAwareFunNotification,
} = require("./notificationGenerator");

// ── Timezone config ────────────────────────────────────────────────────────────

/**
 * The timezone used for all cron schedules and "today" date calculations.
 * Defaults to Asia/Kolkata (IST). Set APP_TIMEZONE in .env to override.
 */
const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kolkata";

/**
 * Get today's date string (YYYY-MM-DD) in the app timezone.
 * This matches how the dashboard and habit controller resolve "today"
 * from the client's localDate param — both use the user's local date,
 * not UTC.
 */
function getTodayStr(timezone = APP_TIMEZONE) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
  // en-CA locale produces YYYY-MM-DD format natively
}

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
      status: { $nin: ["done"] },
      isDeleted: false,
    }).lean();

    for (const task of tasks) {
      const hoursLeft = Math.round((new Date(task.dueDate) - now) / (1000 * 60 * 60));

      // One "due soon" notification per task per 12 hours max
      const existing = await Notification.findOne({
        userId: task.userId,
        "metadata.taskId": String(task._id),
        category: "task",
        createdAt: { $gte: new Date(now.getTime() - 12 * 60 * 60 * 1000) },
      });

      if (!existing) {
        await notifyTaskDueSoon(task.userId, task.title, task._id, hoursLeft);
      }
    }
  } catch (err) {
    console.error("Cron checkTasksDueSoon error:", err.message);
  }
}

// ── Job: Check overdue tasks (once per day at 9 AM IST) ───────────────────────

async function checkOverdueTasks() {
  try {
    const now = new Date();

    const tasks = await Task.find({
      dueDate: { $lt: now },
      status: { $nin: ["done"] },
      isDeleted: false,
    }).lean();

    for (const task of tasks) {
      // Only send ONE overdue notification per task ever
      const existing = await Notification.findOne({
        userId: task.userId,
        "metadata.taskId": String(task._id),
        category: "task",
        title: { $regex: "Overdue", $options: "i" },
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

// ── Job: Habit streak danger check (daily at 8 PM IST) ───────────────────────

async function checkHabitStreaks() {
  try {
    const now = new Date();
    // FIX: use IST "today", matching how habit controller resolves localDate
    const todayStr = getTodayStr();

    const habits = await Habit.find({ isActive: true }).lean();

    for (const habit of habits) {
      // Check if already logged today (in IST)
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

// ── Job: Daily random fun notification (9 AM IST) ─────────────────────────────

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

// ── Job: Inactivity check (daily at 6 PM IST) ────────────────────────────────

async function checkInactiveUsers() {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const users = await User.find(
      { lastActiveAt: { $lt: cutoff } },
      "_id"
    ).lean();

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

// ── Job: Weekly productivity summary (Sunday 8 AM IST) ───────────────────────

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

// ── Job: Evening journal reminder (9 PM IST daily) ───────────────────────────

async function sendJournalReminder() {
  try {
    const userIds = await getAllUserIds();

    for (const userId of userIds) {
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

  const tz = { timezone: APP_TIMEZONE };

  // Every hour — check tasks due soon (no timezone needed, uses absolute time)
  cron.schedule("0 * * * *", checkTasksDueSoon, tz);

  // 9 AM IST — check overdue tasks
  cron.schedule("0 9 * * *", checkOverdueTasks, tz);

  // 8 PM IST — habit streak danger
  cron.schedule("0 20 * * *", checkHabitStreaks, tz);

  // 9 AM IST — fun notification
  cron.schedule("0 9 * * *", sendDailyFunNotification, tz);

  // 6 PM IST — inactivity check
  cron.schedule("0 18 * * *", checkInactiveUsers, tz);

  // 9 PM IST — journal reminder
  cron.schedule("0 21 * * *", sendJournalReminder, tz);

  // Sunday 8 AM IST — weekly summary
  cron.schedule("0 8 * * 0", sendWeeklySummary, tz);

  console.log(`⏰ Notification cron jobs initialized (timezone: ${APP_TIMEZONE})`);
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