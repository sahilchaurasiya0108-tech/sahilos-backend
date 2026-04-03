"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api";

const POLL_INTERVAL = 30_000; // 30s polling for unread count

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all"); // all | important | info | fun
  const pollerRef = useRef(null);

  // ── Fetch notifications ──────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (opts = {}) => {
    const { reset = false, filterType = filter } = opts;
    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
      });
      if (filterType !== "all") params.set("type", filterType);

      const { data } = await api.get(`/notifications?${params}`);
      setUnreadCount(data.unreadCount);
      setNotifications((prev) =>
        reset ? data.data : [...prev, ...data.data]
      );
      setHasMore(currentPage < data.pagination.pages);
      if (reset) setPage(2);
      else setPage((p) => p + 1);
    } catch (err) {
      console.error("fetchNotifications error:", err);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  // ── Poll unread count ────────────────────────────────────────────────────────
  const pollUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications/unread-count");
      setUnreadCount(data.count);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchNotifications({ reset: true, filterType: filter });
  }, [filter]); // eslint-disable-line

  useEffect(() => {
    pollerRef.current = setInterval(pollUnreadCount, POLL_INTERVAL);
    return () => clearInterval(pollerRef.current);
  }, [pollUnreadCount]);

  // FIX: when a push arrives, the SW posts "NOTIFICATION_RECEIVED" — 
  // immediately refresh the list so new notifications appear without needing
  // a manual page reload.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const handleMessage = (event) => {
      if (event.data?.type === "NOTIFICATION_RECEIVED") {
        fetchNotifications({ reset: true });
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleMessage);
  }, [fetchNotifications]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await api.patch("/notifications/read-all");
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback(async (id) => {
    const n = notifications.find((x) => x._id === id);
    await api.delete(`/notifications/${id}`);
    setNotifications((prev) => prev.filter((x) => x._id !== id));
    if (n && !n.read) setUnreadCount((c) => Math.max(0, c - 1));
  }, [notifications]);

  const clearAll = useCallback(async () => {
    const typeParam = filter !== "all" ? `?type=${filter}` : "";
    await api.delete(`/notifications/clear-all${typeParam}`);
    setNotifications([]);
    if (filter === "all") setUnreadCount(0);
    else setUnreadCount((c) => Math.max(0, c));
  }, [filter]);

  const changeFilter = useCallback((f) => {
    setFilter(f);
    setPage(1);
    setHasMore(true);
    setNotifications([]);
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) fetchNotifications();
  }, [loading, hasMore, fetchNotifications]);

  return {
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
    refresh: () => fetchNotifications({ reset: true }),
  };
}