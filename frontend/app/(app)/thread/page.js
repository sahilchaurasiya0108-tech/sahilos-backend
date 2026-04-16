"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { format, isToday, isYesterday } from "date-fns";

// ─── Constants ────────────────────────────────────────────────────────────────
const THREAD_SERVER =
  process.env.NEXT_PUBLIC_RED_THREAD_URL || "http://localhost:4000";
const USER_ID = "sahil"; // SahilOS is always Sahil

// ─── Presence formatter ───────────────────────────────────────────────────────
function formatPresence(presence) {
  const pronoun = "She"; // Sahil sees Gauri

  if (presence.status === "here") return "She's here";

  if (presence.status === "gone" && presence.lastSeen) {
    const last = new Date(presence.lastSeen);
    if (isNaN(last.getTime())) return "She was here recently";

    const now = new Date();
    const diffMins = Math.floor((now - last) / 60_000);

    if (diffMins < 1) return "She was here just now";
    if (diffMins < 60)
      return `She was here ${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;

    const sameDay =
      last.getDate() === now.getDate() &&
      last.getMonth() === now.getMonth() &&
      last.getFullYear() === now.getFullYear();

    if (sameDay) {
      const t = last.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      return `She was here at ${t}`;
    }

    const d = last.toLocaleDateString([], { day: "numeric", month: "short" });
    const t = last.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `She was here on ${d} at ${t}`;
  }

  return "She's been quiet lately";
}

// ─── Timestamp label ──────────────────────────────────────────────────────────
function messageTime(dateStr) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return `yesterday, ${format(d, "h:mm a")}`;
  return format(d, "MMM d, h:mm a");
}

function dayLabel(dateStr) {
  const d = new Date(dateStr);
  if (isToday(d)) return "today";
  if (isYesterday(d)) return "yesterday";
  return format(d, "MMMM d");
}

function shouldShowDivider(messages, index) {
  if (index === 0) return true;
  const prev = new Date(messages[index - 1].createdAt);
  const curr = new Date(messages[index].createdAt);
  return (
    prev.getDate() !== curr.getDate() ||
    prev.getMonth() !== curr.getMonth() ||
    prev.getFullYear() !== curr.getFullYear()
  );
}

// ─── useRedThread hook ────────────────────────────────────────────────────────
function useRedThread() {
  const [messages, setMessages] = useState([]);
  const [otherPresence, setOtherPresence] = useState({
    status: "unknown",
    lastSeen: null,
  });
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(THREAD_SERVER, {
      transports: ["websocket"],
      reconnectionAttempts: 12,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("joinThread", { userId: USER_ID });
      socket.emit("pullThread", { userId: USER_ID });
    });

    socket.on("disconnect", () => setConnected(false));
    socket.on("threadHistory", ({ messages }) => setMessages(messages));

    socket.on("threadMoved", ({ message }) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    });

    socket.on("presence", ({ userId, status, lastSeen }) => {
      if (userId !== USER_ID) setOtherPresence({ status, lastSeen });
    });

    return () => socket.disconnect();
  }, []);

  const sendMessage = useCallback((text) => {
    if (!socketRef.current || !text?.trim()) return;
    socketRef.current.emit("threadMoved", {
      sender: USER_ID,
      text: text.trim(),
    });
  }, []);

  const markSeen = useCallback(() => {
    fetch(`${THREAD_SERVER}/thread/messages/seen`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewer: USER_ID }),
    }).catch(() => {});
  }, []);

  return { messages, otherPresence, connected, sendMessage, markSeen };
}

// ─── Thread Page ──────────────────────────────────────────────────────────────
export default function ThreadPage() {
  const { messages, otherPresence, connected, sendMessage, markSeen } =
    useRedThread();
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    markSeen();
  }, [markSeen]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    sendMessage(text);
    setInput("");
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const presenceText = formatPresence(otherPresence);
  const isHere = otherPresence.status === "here";

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-0">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-6 py-5 border-b border-surface-3 bg-surface-1/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500/20 to-rose-600/20 border border-red-500/20 flex items-center justify-center text-lg">
              🔴
            </div>
            <motion.div
              animate={
                isHere
                  ? { scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }
                  : { scale: 1 }
              }
              transition={
                isHere ? { duration: 2, repeat: Infinity } : {}
              }
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-1"
              style={{ background: isHere ? "#4ade80" : "#334155" }}
            />
          </div>

          {/* Title + presence */}
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-slate-100 tracking-tight">
              The Red Thread
            </h1>
            <motion.p
              key={presenceText}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-xs mt-0.5"
              style={{
                color: isHere ? "#4ade80" : "#64748b",
                fontStyle: "italic",
              }}
            >
              {presenceText}
            </motion.p>
          </div>

          {/* Connection dot */}
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: connected ? "#4ade80" : "#334155" }}
            title={connected ? "Connected" : "Reconnecting…"}
          />
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto px-6 py-6"
        style={{ scrollbarWidth: "thin" }}
      >
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-center h-full"
          >
            <p
              className="text-slate-600 text-sm italic text-center"
              style={{ fontFamily: "'Dancing Script', cursive" }}
            >
              the thread is waiting…
            </p>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const isMine = msg.sender === USER_ID;
            const showDivider = shouldShowDivider(messages, i);

            return (
              <motion.div key={msg._id || i}>
                {/* Day divider */}
                {showDivider && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 my-6"
                  >
                    <div className="flex-1 h-px bg-surface-3" />
                    <span className="text-[10px] text-slate-600 uppercase tracking-widest font-medium">
                      {dayLabel(msg.createdAt)}
                    </span>
                    <div className="flex-1 h-px bg-surface-3" />
                  </motion.div>
                )}

                {/* Message */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className={`mb-5 flex flex-col ${isMine ? "items-end" : "items-start"}`}
                >
                  {/* Sender label */}
                  <p className="text-[9px] uppercase tracking-[0.12em] text-slate-600 mb-1.5 px-1">
                    {isMine ? "you" : "her"}
                  </p>

                  {/* Bubble */}
                  <div
                    className={`max-w-lg px-4 py-3 rounded-2xl ${
                      isMine
                        ? "bg-brand/20 border border-brand/25"
                        : "bg-surface-2 border border-surface-3"
                    }`}
                    style={{
                      borderBottomRightRadius: isMine ? "4px" : undefined,
                      borderBottomLeftRadius: !isMine ? "4px" : undefined,
                    }}
                  >
                    <p
                      className="leading-relaxed whitespace-pre-wrap break-words"
                      style={{
                        fontFamily: isMine
                          ? "'Outfit', sans-serif"
                          : "'Caveat', cursive",
                        fontSize: isMine ? "0.875rem" : "1.15rem",
                        color: isMine ? "#c7d2fe" : "#f1f5f9",
                        lineHeight: isMine ? "1.55" : "1.45",
                      }}
                    >
                      {msg.text}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center gap-1.5 mt-1 px-1">
                    <p className="text-[9px] text-slate-600">
                      {messageTime(msg.createdAt)}
                    </p>
                    {isMine && msg.seen && (
                      <span className="text-[9px] text-brand/40">✓</span>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* ── Input ──────────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-6 pb-6 pt-3 border-t border-surface-3 bg-surface-1/50 backdrop-blur-sm">
        <div className="flex items-end gap-3 bg-surface-2 border border-surface-3 rounded-xl p-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="pull the thread…"
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-slate-200 placeholder:text-slate-600 px-3 py-2 max-h-32 font-sans"
            style={{ scrollbarWidth: "none" }}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!input.trim() || !connected}
            className="w-9 h-9 rounded-lg bg-brand/20 border border-brand/30 text-brand hover:bg-brand/30 disabled:opacity-25 flex items-center justify-center transition-colors shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 12V2M7 2L2 7M7 2L12 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>
        </div>
        <p className="text-[9px] text-slate-700 text-center mt-2 tracking-widest uppercase">
          only the two of you
        </p>
      </div>
    </div>
  );
}