"use client";
import { useState, useRef, useEffect } from "react";
import { Bell, X, CheckCheck, Trash2, Sparkles, AlertCircle, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import { useNotificationCount } from "@/context/NotificationContext";
import { formatDistanceToNow } from "date-fns";

// ── Type config ────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  important: {
    icon: <AlertCircle size={13} />,
    dot: "bg-red-500",
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
    label: "Important",
  },
  info: {
    icon: <Info size={13} />,
    dot: "bg-blue-500",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    label: "Info",
  },
  fun: {
    icon: <Sparkles size={13} />,
    dot: "bg-purple-500",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    label: "Fun",
  },
};

const FILTERS = ["all", "important", "info", "fun"];

// ── NotificationItem ──────────────────────────────────────────────────────────
function NotificationItem({ notification, onRead, onDelete }) {
  const router = useRouter();
  const cfg = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info;

  const handleClick = () => {
    if (!notification.read) onRead(notification._id);
    if (notification.actionLink) router.push(notification.actionLink);
  };

  return (
    <div
      className={`group relative flex gap-3 px-4 py-3 hover:bg-surface-3/50 transition-colors cursor-pointer border-b border-surface-3/50 last:border-0 ${
        !notification.read ? "bg-surface-3/30" : ""
      }`}
      onClick={handleClick}
    >
      {/* Unread dot */}
      {!notification.read && (
        <span
          className={`absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${cfg.dot}`}
        />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 pl-1">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-xs font-semibold leading-snug ${notification.read ? "text-slate-400" : "text-slate-100"}`}>
            {notification.title}
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(notification._id); }}
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-slate-400"
          >
            <X size={12} />
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${cfg.badge}`}>
            {cfg.icon}
            {cfg.label}
          </span>
          <span className="text-[10px] text-slate-600">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── NotificationBell ──────────────────────────────────────────────────────────
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { unreadCount: globalUnread, setUnreadCount: setGlobalUnread } = useNotificationCount();
  const {
    notifications,
    unreadCount: localUnread,
    loading,
    hasMore,
    filter,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    changeFilter,
    loadMore,
  } = useNotifications();

  // Keep global context in sync with local hook
  useEffect(() => {
    setGlobalUnread(localUnread);
  }, [localUnread, setGlobalUnread]);

  const unreadCount = open ? localUnread : globalUnread;

  // Close on outside click
  useEffect(() => {
    function handle(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-surface-3 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-10 w-80 rounded-xl border border-surface-3 bg-surface-2 shadow-2xl shadow-black/40 z-50 overflow-hidden"
          style={{ animation: "slideDown 0.15s ease-out" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-3">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-slate-400" />
              <span className="text-sm font-semibold text-slate-100">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  title="Mark all as read"
                  className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <CheckCheck size={14} />
                </button>
              )}
              <button
                onClick={clearAll}
                title="Clear all"
                className="p-1 text-slate-500 hover:text-red-400 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-1 px-3 py-2 border-b border-surface-3/50">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => changeFilter(f)}
                className={`text-[10px] px-2.5 py-1 rounded-full capitalize transition-colors font-medium ${
                  filter === f
                    ? "bg-indigo-600 text-white"
                    : "text-slate-500 hover:text-slate-300 hover:bg-surface-3"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto overscroll-contain">
            {loading && notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell size={24} className="mx-auto text-slate-700 mb-2" />
                <p className="text-sm text-slate-500">All quiet here 🌙</p>
                <p className="text-xs text-slate-600 mt-1">No notifications yet</p>
              </div>
            ) : (
              <>
                {notifications.map((n) => (
                  <NotificationItem
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
                    className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {loading ? "Loading…" : "Load more"}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-surface-3 px-4 py-2.5">
            <a
              href="/notifications"
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              onClick={() => setOpen(false)}
            >
              View all notifications →
            </a>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
