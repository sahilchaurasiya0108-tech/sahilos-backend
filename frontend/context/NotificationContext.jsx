"use client";
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const NotificationContext = createContext({ unreadCount: 0, refresh: () => {} });

const POLL_MS = 30_000;

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const timerRef = useRef(null);

  const fetchCount = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get("/notifications/unread-count");
      setUnreadCount(data.count ?? 0);
    } catch (_) {}
  }, [user]);

  // Regular 30s poll
  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    fetchCount();
    timerRef.current = setInterval(fetchCount, POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [user, fetchCount]);

  // FIX: listen for the SW's "NOTIFICATION_RECEIVED" message so the bell
  // badge and notification list update the instant a push lands —
  // no need to wait for the next 30-second poll tick.
  useEffect(() => {
    if (!user || typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const handleMessage = (event) => {
      if (event.data?.type === "NOTIFICATION_RECEIVED") {
        fetchCount();
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleMessage);
  }, [user, fetchCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refresh: fetchCount, setUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotificationCount = () => useContext(NotificationContext);