const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
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
} = require("../controllers/notificationController");

router.use(protect);

router.get("/",              getNotifications);
router.post("/",             createNotificationRoute);
router.get("/unread-count",  getUnreadCount);
router.get("/vapid-key",     getVapidKey);
router.patch("/read-all",    markAllAsRead);
router.delete("/clear-all",  clearAll);
router.post("/subscribe",    subscribePush);
router.delete("/unsubscribe", unsubscribePush);  
router.patch("/:id/read",    markAsRead);
router.delete("/:id",        deleteNotification); 
router.post("/fun",          sendFunNotification);

module.exports = router;
