"use client";
import { useState } from "react";
import { Bell, CheckCheck, Trash2, Sparkles, AlertCircle, Info, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import PushNotificationSettings from "@/components/notifications/PushNotificationSettings";

const TYPE_CONFIG = {
  important: {
    icon: <AlertCircle size={14} />,
    dot: "bg-red-500",
    ring: "border-red-500/30",
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
    label: "Important",
    emoji: "🚨",
  },
  info: {
    icon: <Info size={14} />,
    dot: "bg-blue-500",
    ring: "border-blue-500/30",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    label: "Info",
    emoji: "📢",
  },
  fun: {
    icon: <Sparkles size={14} />,
    dot: "bg-purple-500",
    ring: "border-purple-500/30",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    label: "Fun",
    emoji: "🎉",
  },
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "important", label: "🚨 Important" },
  { value: "info", label: "📢 Info" },
  { value: "fun", label: "🎉 Fun" },
];

function NotificationCard({ notification, onRead, onDelete }) {
  const router = useRouter();
  const cfg = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info;

  return (
    <div
      onClick={() => {
        if (!notification.read) onRead(notification._id);
        if (notification.actionLink) router.push(notification.actionLink);
      }}
      className={`group relative rounded-xl border p-4 cursor-pointer transition-all hover:border-slate-600 ${
        notification.read
          ? "border-surface-3 bg-surface-2/50 opacity-70"
          : `border-surface-3 bg-surface-2 ${cfg.ring}`
      }`}
    >
      {!notification.read && (
        <span className={`absolute top-4 left-4 w-2 h-2 rounded-full ${cfg.dot}`} />
      )}

      <div className="flex items-start justify-between gap-3 pl-4">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${notification.read ? "text-slate-400" : "text-slate-100"}`}>
            {notification.title}
          </p>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            {notification.message}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border font-medium ${cfg.badge}`}>
              {cfg.icon}
              {cfg.label}
            </span>
            {notification.category && notification.category !== "system" && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-3 text-slate-500 capitalize">
                {notification.category}
              </span>
            )}
            <span className="text-[11px] text-slate-600 ml-auto">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(notification._id); }}
          className="shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    filter,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    changeFilter,
    loadMore,
    refresh,
  } = useNotifications();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 flex items-center justify-center">
            <Bell size={16} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-slate-500">{unreadCount} unread</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-surface-3 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-3 text-slate-400 hover:text-slate-200 text-xs transition-colors"
            >
              <CheckCheck size={13} />
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-3 text-slate-500 hover:text-red-400 text-xs transition-colors"
            >
              <Trash2 size={13} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Push settings */}
      <PushNotificationSettings onCleanup={refresh} />

      {/* Filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => changeFilter(f.value)}
            className={`shrink-0 text-xs px-3.5 py-1.5 rounded-full font-medium transition-colors ${
              filter === f.value
                ? "bg-indigo-600 text-white"
                : "bg-surface-3 text-slate-400 hover:text-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading && notifications.length === 0 ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-surface-2 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-4xl mb-3">🌙</div>
          <p className="text-slate-400 font-medium">All quiet here</p>
          <p className="text-sm text-slate-600 mt-1">
            {filter === "all"
              ? "No notifications yet. Go do something interesting."
              : `No ${filter} notifications.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationCard
              key={n._id}
              notification={n}
              onRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))}

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full py-3 text-sm text-slate-500 hover:text-slate-300 transition-colors rounded-xl bg-surface-2 hover:bg-surface-3 border border-surface-3"
            >
              {loading ? "Loading…" : "Load more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
