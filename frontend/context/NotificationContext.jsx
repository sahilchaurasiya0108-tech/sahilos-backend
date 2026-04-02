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

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    fetchCount();
    timerRef.current = setInterval(fetchCount, POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [user, fetchCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refresh: fetchCount, setUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotificationCount = () => useContext(NotificationContext);
