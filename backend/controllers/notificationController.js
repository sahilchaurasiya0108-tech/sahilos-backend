const asyncHandler = require("../middleware/asyncHandler");
const Notification = require("../models/Notification");
const PushSubscription = require("../models/PushSubscription");
const { createNotification } = require("../utils/notificationService");
const { generateFunNotification } = require("../utils/notificationGenerator");

// ── GET /notifications ────────────────────────────────────────────────────────
const getNotifications = asyncHandler(async (req, res) => {
  const { type, unreadOnly, limit = 30, page = 1 } = req.query;

  const filter = { userId: req.user._id };
  if (type) filter.type = type;
  if (unreadOnly === "true") filter.read = false;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: req.user._id, read: false }),
  ]);

  res.json({
    success: true,
    data: notifications,
    unreadCount,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ── POST /notifications ───────────────────────────────────────────────────────
const createNotificationRoute = asyncHandler(async (req, res) => {
  const { title, message, type, category, actionLink, scheduledFor, metadata } = req.body;

  const notification = await createNotification({
    userId: req.user._id,
    title,
    message,
    type,
    category,
    actionLink,
    scheduledFor,
    metadata,
  });

  res.status(201).json({ success: true, data: notification });
});

// ── PATCH /notifications/:id/read ─────────────────────────────────────────────
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { read: true },
    { new: true }
  );

  if (!notification) {
    res.statusCode = 404;
    throw new Error("Notification not found");
  }

  res.json({ success: true, data: notification });
});

// ── PATCH /notifications/read-all ─────────────────────────────────────────────
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, read: false },
    { read: true }
  );
  res.json({ success: true, message: "All notifications marked as read" });
});

// ── DELETE /notifications/:id ─────────────────────────────────────────────────
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!notification) {
    res.statusCode = 404;
    throw new Error("Notification not found");
  }

  res.json({ success: true, message: "Notification deleted" });
});

// ── DELETE /notifications/clear-all ──────────────────────────────────────────
const clearAll = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const filter = { userId: req.user._id };
  if (type) filter.type = type;

  await Notification.deleteMany(filter);
  res.json({ success: true, message: "Notifications cleared" });
});

// ── GET /notifications/unread-count ──────────────────────────────────────────
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    userId: req.user._id,
    read: false,
  });
  res.json({ success: true, count });
});

// ── POST /notifications/subscribe (web push) ──────────────────────────────────
const subscribePush = asyncHandler(async (req, res) => {
  const { subscription } = req.body;

  if (!subscription?.endpoint) {
    res.statusCode = 400;
    throw new Error("Invalid push subscription");
  }

  await PushSubscription.findOneAndUpdate(
    { "subscription.endpoint": subscription.endpoint },
    { userId: req.user._id, subscription },
    { upsert: true, new: true }
  );

  res.status(201).json({ success: true, message: "Push subscription saved" });
});

// ── DELETE /notifications/unsubscribe ─────────────────────────────────────────
const unsubscribePush = asyncHandler(async (req, res) => {
  const { endpoint } = req.body;
  await PushSubscription.deleteOne({ "subscription.endpoint": endpoint });
  res.json({ success: true, message: "Unsubscribed" });
});

// ── GET /notifications/vapid-key ──────────────────────────────────────────────
const getVapidKey = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    publicKey: process.env.VAPID_PUBLIC_KEY || null,
  });
});

// ── POST /notifications/fun (generate a fun one on demand) ────────────────────
const sendFunNotification = asyncHandler(async (req, res) => {
  const { category } = req.body;
  const fun = generateFunNotification(category);

  const notification = await createNotification({
    userId: req.user._id,
    ...fun,
    sendPush: false,
  });

  res.status(201).json({ success: true, data: notification });
});

module.exports = {
  getNotifications,
  createNotificationRoute,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll,
  getUnreadCount,
  subscribePush,
  unsubscribePush,
  getVapidKey,
  sendFunNotification,
};
