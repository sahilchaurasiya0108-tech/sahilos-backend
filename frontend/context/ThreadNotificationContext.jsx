"use client";
/**
 * ThreadNotificationContext — SahilOS
 *
 * Maintains a lightweight persistent socket connection to the Red Thread server
 * for in-app notification purposes. The actual chat (thread/page.js) has its
 * own socket; this one lives at the layout level for the badge + toast.
 *
 * Rules:
 *  - Only fires a toast when a new message arrives AND /thread is NOT the
 *    current pathname (i.e. chat is closed).
 *  - Tracks unreadCount for the sidebar badge.
 *  - Count + toast both clear when the user navigates to /thread.
 *  - Deduplicates by message _id — rapid bursts = one notification.
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";
import { io } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";

const THREAD_SERVER =
  process.env.NEXT_PUBLIC_RED_THREAD_URL || "http://localhost:4000";

const USER_ID = "sahil";

const NOTIF_LINES = [
  "oh, she replied",
  "that didn't take long",
  "someone's here",
  "you might wanna check this",
  "well… that was fast",
  "guess who's back",
  "she said something",
  "don't keep her waiting",
  "new message. just so you know",
  "the thread moved",
  "oh look, a message",
  "she's talking to you",
];

function pickLine(lastLine) {
  const pool = NOTIF_LINES.filter((l) => l !== lastLine);
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Context ───────────────────────────────────────────────────────────────────
const ThreadNotificationContext = createContext({
  unreadCount: 0,
  resetUnread: () => {},
});

// ── Toast (pure DOM — no lib dependency, survives layout changes) ─────────────
function showThreadToast(line, onClickCb) {
  const existing = document.getElementById("thread-notif-toast");
  if (existing) {
    // Update text in-place instead of rebuilding
    existing.textContent = line;
    return;
  }

  const el = document.createElement("div");
  el.id = "thread-notif-toast";
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");

  Object.assign(el.style, {
    position: "fixed",
    bottom: "24px",
    right: "20px",
    zIndex: "9999",
    background: "rgba(15,23,42,0.94)",
    border: "1px solid rgba(239,68,68,0.25)",
    borderLeft: "3px solid rgba(239,68,68,0.75)",
    color: "#cbd5e1",
    fontFamily: "'Outfit', sans-serif",
    fontSize: "13px",
    padding: "10px 16px",
    borderRadius: "10px",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
    letterSpacing: "0.01em",
    maxWidth: "260px",
    opacity: "0",
    transform: "translateY(8px)",
    transition: "opacity 0.22s ease, transform 0.22s ease",
    cursor: "pointer",
    userSelect: "none",
  });

  el.textContent = line;

  el.addEventListener("click", () => {
    dismissThreadToast();
    onClickCb?.();
  });

  document.body.appendChild(el);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    });
  });
}

function dismissThreadToast() {
  const el = document.getElementById("thread-notif-toast");
  if (!el) return;
  el.style.opacity = "0";
  el.style.transform = "translateY(8px)";
  setTimeout(() => el.remove(), 240);
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function ThreadNotificationProvider({ children }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isChatOpen = pathname === "/thread";

  const [unreadCount, setUnreadCount] = useState(0);

  const isChatOpenRef = useRef(isChatOpen);
  const seenIdsRef    = useRef(new Set());
  const lastLineRef   = useRef(null);
  const toastTimerRef = useRef(null);
  const mountedRef    = useRef(true);

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
    if (isChatOpen) {
      setUnreadCount(0);
      dismissThreadToast();
      clearTimeout(toastTimerRef.current);
    }
  }, [isChatOpen]);

  const fireToast = useCallback(() => {
    const line = pickLine(lastLineRef.current);
    lastLineRef.current = line;

    clearTimeout(toastTimerRef.current);
    showThreadToast(line, () => {
      window.dispatchEvent(new CustomEvent("thread:open"));
    });

    toastTimerRef.current = setTimeout(dismissThreadToast, 4500);
  }, []);

  useEffect(() => {
    if (!user) return;
    mountedRef.current = true;

    const socket = io(THREAD_SERVER, {
      transports: ["websocket"],
      reconnectionAttempts: 20,
      reconnectionDelay: 3000,
    });

    socket.on("connect", () => {
      // Use watchThread (NOT joinThread) so this background notification socket
      // is never added to connectedUsers on the server. If joinThread were used
      // here, Sahil would always appear "online" to the server from the layout,
      // causing every message Gauri sends to instantly get seen:true (double tick)
      // even before he's opened the thread — and his presence would show as
      // "here" even when he's on a completely different page.
      socket.emit("watchThread", { userId: USER_ID });
    });

    // Prime seenIds — no toasts for history
    socket.on("threadHistory", ({ messages }) => {
      messages.forEach((m) => seenIdsRef.current.add(String(m._id)));
    });

    socket.on("threadMoved", ({ message }) => {
      if (!mountedRef.current) return;
      if (message.sender === USER_ID) return;

      const id = String(message._id);
      if (seenIdsRef.current.has(id)) return;
      seenIdsRef.current.add(id);

      if (!isChatOpenRef.current) {
        setUnreadCount((c) => c + 1);
        fireToast();
      }
    });

    return () => {
      mountedRef.current = false;
      clearTimeout(toastTimerRef.current);
      dismissThreadToast();
      socket.disconnect();
    };
  }, [user, fireToast]);

  const resetUnread = useCallback(() => {
    setUnreadCount(0);
    dismissThreadToast();
    clearTimeout(toastTimerRef.current);
  }, []);

  return (
    <ThreadNotificationContext.Provider value={{ unreadCount, resetUnread }}>
      {children}
    </ThreadNotificationContext.Provider>
  );
}

export const useThreadNotifications = () =>
  useContext(ThreadNotificationContext);
