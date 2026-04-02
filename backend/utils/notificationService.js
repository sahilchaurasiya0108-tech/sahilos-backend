const Notification = require("../models/Notification");
const PushSubscription = require("../models/PushSubscription");

// Conditionally load web-push (optional dependency)
let webpush = null;
try {
  webpush = require("web-push");
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:admin@sahilos.app",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  } else {
    webpush = null; // VAPID not configured
  }
} catch (_) {
  // web-push not installed — push notifications disabled
}

// ── Core create ────────────────────────────────────────────────────────────────

/**
 * Create a notification in DB and optionally send a web push.
 */
async function createNotification({
  userId,
  title,
  message,
  type = "info",
  category = "system",
  actionLink = null,
  scheduledFor = null,
  metadata = {},
  sendPush = false,
}) {
  const notification = await Notification.create({
    userId,
    title,
    message,
    type,
    category,
    actionLink,
    scheduledFor,
    metadata,
  });

  if (sendPush) {
    await sendPushToUser(userId, { title, message, actionLink });
  }

  return notification;
}

// ── Web Push ───────────────────────────────────────────────────────────────────

async function sendPushToUser(userId, { title, message, actionLink = "/" }) {
  if (!webpush) return;

  const subs = await PushSubscription.find({ userId });
  if (!subs.length) return;

  const payload = JSON.stringify({
    title,
    body: message,
    url: actionLink || "/",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
  });

  const results = await Promise.allSettled(
    subs.map((s) => webpush.sendNotification(s.subscription, payload))
  );

  // Remove expired/invalid subscriptions
  for (let i = 0; i < results.length; i++) {
    if (results[i].status === "rejected") {
      const statusCode = results[i].reason?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await PushSubscription.findByIdAndDelete(subs[i]._id);
      }
    }
  }
}

// ── Trigger helpers (called by controllers / cron) ────────────────────────────

async function notifyTaskDueSoon(userId, taskTitle, taskId, hoursLeft) {
  return createNotification({
    userId,
    title: hoursLeft <= 2 ? "⏰ Task due VERY soon!" : "⏰ Task due soon",
    message:
      hoursLeft <= 2
        ? `"${taskTitle}" is due in ${hoursLeft}h. You got this (or at least try).`
        : `"${taskTitle}" is due in ${hoursLeft} hours. Maybe don't ignore this one.`,
    type: "important",
    category: "task",
    actionLink: "/tasks",
    metadata: { taskId, hoursLeft },
    sendPush: true,
  });
}

async function notifyTaskOverdue(userId, taskTitle, taskId) {
  return createNotification({
    userId,
    title: "🚨 Task Overdue",
    message: `"${taskTitle}" has crossed the deadline. Your past self had one job.`,
    type: "important",
    category: "task",
    actionLink: "/tasks",
    metadata: { taskId },
    sendPush: true,
  });
}

async function notifyHabitStreakDanger(userId, habitName, habitId, streak) {
  return createNotification({
    userId,
    title: "🔥 Streak in danger!",
    message: `Your "${habitName}" streak of ${streak} days is about to break 💔 Don't let it end like this.`,
    type: "important",
    category: "habit",
    actionLink: "/habits",
    metadata: { habitId, streak },
    sendPush: true,
  });
}

async function notifyHabitMilestone(userId, habitName, habitId, streak) {
  return createNotification({
    userId,
    title: `🏅 ${streak}-day streak!`,
    message: `"${habitName}" — ${streak} days straight. You're basically a different person now.`,
    type: "info",
    category: "habit",
    actionLink: "/habits",
    metadata: { habitId, streak },
    sendPush: false,
  });
}

async function notifyAchievementUnlocked(userId, achievementName, achievementId) {
  return createNotification({
    userId,
    title: "🏆 Achievement Unlocked!",
    message: `You just unlocked "${achievementName}". Your future self just gave you a standing ovation 🎉`,
    type: "important",
    category: "achievement",
    actionLink: "/achievements",
    metadata: { achievementId },
    sendPush: true,
  });
}

async function notifyBudgetWarning(userId, category, percentUsed) {
  return createNotification({
    userId,
    title: "💸 Budget Warning",
    message: `You've used ${percentUsed}% of your "${category}" budget. Your wallet is giving you a look.`,
    type: "important",
    category: "budget",
    actionLink: "/budget",
    metadata: { category, percentUsed },
    sendPush: false,
  });
}

async function notifyInactivity(userId, daysInactive) {
  const { generateFunNotification } = require("./notificationGenerator");
  const fun = generateFunNotification("roasting");
  return createNotification({
    userId,
    title: fun.title,
    message: fun.message,
    type: "fun",
    category: "fun",
    metadata: { daysInactive },
    sendPush: true,
  });
}

async function notifyLearningReminder(userId) {
  return createNotification({
    userId,
    title: "📚 Learning reminder",
    message: "You haven't logged any learning today. Your brain is bored.",
    type: "info",
    category: "learning",
    actionLink: "/learning",
    sendPush: false,
  });
}

async function notifyJournalReminder(userId) {
  return createNotification({
    userId,
    title: "📓 Journal time",
    message: "How was your day? Your future self will want to know.",
    type: "info",
    category: "journal",
    actionLink: "/journal",
    sendPush: false,
  });
}

module.exports = {
  createNotification,
  sendPushToUser,
  notifyTaskDueSoon,
  notifyTaskOverdue,
  notifyHabitStreakDanger,
  notifyHabitMilestone,
  notifyAchievementUnlocked,
  notifyBudgetWarning,
  notifyInactivity,
  notifyLearningReminder,
  notifyJournalReminder,
};
