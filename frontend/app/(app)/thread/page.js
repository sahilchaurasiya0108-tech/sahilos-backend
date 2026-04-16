"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { format, isToday, isYesterday } from "date-fns";

// ─── Constants ────────────────────────────────────────────────────────────────
const THREAD_SERVER =
  process.env.NEXT_PUBLIC_RED_THREAD_URL || "http://localhost:4000";
const USER_ID = "sahil"; // SahilOS is always Sahil

// ─── Presence formatter ───────────────────────────────────────────────────────
function formatPresence(presence) {
  // Sahil always sees Gauri's presence
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

function getGroupInfo(messages, index) {
  const msg = messages[index];
  const prev = messages[index - 1];
  const next = messages[index + 1];

  const sameAsPrev = prev && prev.sender === msg.sender && !shouldShowDivider(messages, index);
  const sameAsNext = next && next.sender === msg.sender && !shouldShowDivider(messages, index + 1);

  return {
    isFirst: !sameAsPrev,
    isLast: !sameAsNext,
    isMid: sameAsPrev && sameAsNext,
  };
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

  // sendMessage accepts optional replyTo object
  const sendMessage = useCallback((text, replyTo = null) => {
    if (!socketRef.current || !text?.trim()) return;
    socketRef.current.emit("threadMoved", {
      sender: USER_ID,
      text: text.trim(),
      replyTo: replyTo
        ? { _id: replyTo._id, text: replyTo.text, sender: replyTo.sender }
        : null,
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

// ─── ReplyPreview (inside bubble) ────────────────────────────────────────────
const ReplyPreview = memo(function ReplyPreview({ replyTo, isMine, onScrollTo }) {
  if (!replyTo?._id) return null;

  // Sahil's side: sender=sahil → "You", sender=gauri → "Her"
  const senderLabel = replyTo.sender === USER_ID ? "You" : "Her";

  return (
    <button
      onClick={() => onScrollTo(replyTo._id)}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        marginBottom: "4px",
      }}
    >
      <div
        style={{
          borderLeft: `2px solid ${isMine ? "rgba(199,210,254,0.4)" : "var(--brand, #6366f1)"}`,
          paddingLeft: "8px",
          paddingTop: "4px",
          paddingBottom: "4px",
          paddingRight: "6px",
          background: isMine
            ? "rgba(255,255,255,0.07)"
            : "rgba(255,255,255,0.04)",
          borderRadius: "6px",
          marginBottom: "2px",
        }}
      >
        <p
          style={{
            fontSize: "9px",
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: isMine ? "rgba(199,210,254,0.6)" : "#64748b",
            marginBottom: "1px",
          }}
        >
          {senderLabel}
        </p>
        <p
          style={{
            fontSize: "11px",
            fontFamily: "'Outfit', sans-serif",
            color: isMine ? "rgba(199,210,254,0.75)" : "#94a3b8",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "100%",
            lineHeight: "1.3",
            margin: 0,
          }}
        >
          {replyTo.text}
        </p>
      </div>
    </button>
  );
});

// ─── MessageBubble ─────────────────────────────────────────────────────────────
const MessageBubble = memo(function MessageBubble({
  msg,
  groupInfo,
  onSwipeReply,
  onScrollToReply,
}) {
  const isMine = msg.sender === USER_ID;
  const { isFirst, isLast } = groupInfo;

  const touchStartX = useRef(null);
  const [swipeDelta, setSwipeDelta] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    setSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    const dir = isMine ? -1 : 1;
    const clamped = Math.max(0, delta * dir);
    setSwipeDelta(Math.min(clamped, 60));
  };

  const handleTouchEnd = () => {
    if (swipeDelta > 40) onSwipeReply(msg);
    setSwipeDelta(0);
    setSwiping(false);
    touchStartX.current = null;
  };

  const translateX = isMine ? -swipeDelta : swipeDelta;

  // Border radius based on group position
  const getBorderRadius = () => {
    if (isFirst && isLast) return "14px";
    if (isMine) {
      if (isFirst) return "14px 14px 4px 14px";
      if (isLast) return "4px 14px 14px 14px";
      return "4px 14px 14px 4px";
    } else {
      if (isFirst) return "14px 14px 14px 4px";
      if (isLast) return "4px 4px 14px 14px";
      return "4px 4px 4px 4px";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      style={{
        marginTop: isFirst ? "10px" : "2px",
        marginBottom: isLast ? "2px" : "1px",
        display: "flex",
        flexDirection: "column",
        alignItems: isMine ? "flex-end" : "flex-start",
        position: "relative",
      }}
    >
      {/* Swipe indicator */}
      {swipeDelta > 10 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
            left: isMine ? undefined : "-26px",
            right: isMine ? "-26px" : undefined,
            opacity: Math.min(swipeDelta / 40, 1),
            transition: "opacity 0.1s",
            fontSize: "12px",
            color: "#64748b",
          }}
        >
          ↩
        </div>
      )}

      {/* Swipeable bubble */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          maxWidth: "75%",
          transform: `translateX(${translateX}px)`,
          transition: swiping
            ? "none"
            : "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          data-message-id={msg._id}
          style={{
            padding: msg.replyTo?._id ? "8px 12px 8px 10px" : "7px 12px",
            borderRadius: getBorderRadius(),
            background: isMine
              ? "var(--brand-bg, rgba(99,102,241,0.2))"
              : "var(--surface-2, #1e293b)",
            border: isMine
              ? "1px solid var(--brand-border, rgba(99,102,241,0.25))"
              : "1px solid var(--surface-3, #334155)",
          }}
        >
          {msg.replyTo?._id && (
            <ReplyPreview
              replyTo={msg.replyTo}
              isMine={isMine}
              onScrollTo={onScrollToReply}
            />
          )}

          <p
            style={{
              fontFamily: isMine
                ? "'Outfit', sans-serif"
                : "'Dancing Script', cursive",
              fontSize: isMine ? "13.5px" : "16px",
              lineHeight: isMine ? "1.5" : "1.35",
              color: isMine ? "#c7d2fe" : "#f1f5f9",
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {msg.text}
          </p>
        </div>
      </div>

      {/* Timestamp — only on last in cluster */}
      {isLast && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            marginTop: "2px",
            paddingLeft: isMine ? 0 : "2px",
            paddingRight: isMine ? "2px" : 0,
          }}
        >
          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "9px",
              color: "#64748b",
              margin: 0,
            }}
          >
            {messageTime(msg.createdAt)}
          </p>
          {isMine && msg.seen && (
            <span style={{ fontSize: "9px", color: "var(--brand, #6366f1)", opacity: 0.5 }}>
              ✓
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
});

// ─── ReplyBanner ─────────────────────────────────────────────────────────────
function ReplyBanner({ replyingTo, onCancel }) {
  if (!replyingTo) return null;

  const senderLabel = replyingTo.sender === USER_ID ? "You" : "Her";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 10px",
        borderRadius: "10px",
        background: "var(--surface-2, #1e293b)",
        border: "1px solid var(--surface-3, #334155)",
        marginBottom: "6px",
      }}
    >
      <div
        style={{
          width: "2px",
          alignSelf: "stretch",
          borderRadius: "2px",
          background: "var(--brand, #6366f1)",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "9px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#64748b",
            margin: "0 0 1px",
          }}
        >
          Replying to {senderLabel}
        </p>
        <p
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "12px",
            color: "#94a3b8",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            margin: 0,
          }}
        >
          {replyingTo.text}
        </p>
      </div>
      <button
        onClick={onCancel}
        style={{
          background: "none",
          border: "none",
          padding: "2px 4px",
          cursor: "pointer",
          color: "#64748b",
          fontSize: "13px",
          lineHeight: 1,
          flexShrink: 0,
        }}
        aria-label="Cancel reply"
      >
        ✕
      </button>
    </motion.div>
  );
}

// ─── Thread Page ──────────────────────────────────────────────────────────────
export default function ThreadPage() {
  const { messages, otherPresence, connected, sendMessage, markSeen } =
    useRedThread();
  const [input, setInput] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const messageRefs = useRef({});

  // Auto-scroll only if near bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    markSeen();
  }, [markSeen]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 112) + "px";
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    sendMessage(text, replyingTo);
    setInput("");
    setReplyingTo(null);
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.focus();
    }
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape" && replyingTo) {
      setReplyingTo(null);
    }
  };

  const scrollToMessage = useCallback((id) => {
    const el = messageRefs.current[id];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedId(id);
    setTimeout(() => setHighlightedId(null), 1800);
  }, []);

  const presenceText = formatPresence(otherPresence);
  const isHere = otherPresence.status === "here";

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 sticky top-0 z-10 bg-surface-1/80 backdrop-blur-sm"
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid var(--surface-3, #334155)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(225,29,72,0.2))",
                border: "1px solid rgba(239,68,68,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
              }}
            >
              🔴
            </div>
            <motion.div
              animate={
                isHere
                  ? { scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }
                  : { scale: 1 }
              }
              transition={isHere ? { duration: 2, repeat: Infinity } : {}}
              style={{
                position: "absolute",
                bottom: "-1px",
                right: "-1px",
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: isHere ? "#4ade80" : "#334155",
                border: "2px solid var(--surface-1, #0f172a)",
              }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#f1f5f9",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              The Red Thread
            </h1>
            <motion.p
              key={presenceText}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                fontSize: "10px",
                color: isHere ? "#4ade80" : "#64748b",
                fontStyle: "italic",
                margin: 0,
              }}
            >
              {presenceText}
            </motion.p>
          </div>

          <div
            title={connected ? "Connected" : "Reconnecting…"}
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: connected ? "#4ade80" : "#334155",
              flexShrink: 0,
            }}
          />
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 14px 4px",
          scrollbarWidth: "thin",
        }}
      >
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <p
              style={{
                fontFamily: "'Dancing Script', cursive",
                fontSize: "1.2rem",
                color: "#475569",
                textAlign: "center",
              }}
            >
              the thread is waiting…
            </p>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const showDivider = shouldShowDivider(messages, i);
            const groupInfo = getGroupInfo(messages, i);
            const isHighlighted = highlightedId === msg._id;

            return (
              <div key={msg._id || i}>
                {showDivider && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      margin: "14px 0 8px",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: "1px",
                        background: "#1e293b",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "9px",
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        color: "#475569",
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 500,
                      }}
                    >
                      {dayLabel(msg.createdAt)}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: "1px",
                        background: "#1e293b",
                      }}
                    />
                  </motion.div>
                )}

                {/* Highlight wrapper */}
                <div
                  ref={(el) => {
                    if (el) messageRefs.current[msg._id] = el;
                  }}
                  style={{
                    borderRadius: "10px",
                    transition: "background 0.3s ease",
                    background: isHighlighted
                      ? "rgba(99,102,241,0.1)"
                      : "transparent",
                    padding: isHighlighted ? "0 4px" : "0",
                    margin: isHighlighted ? "0 -4px" : "0",
                  }}
                >
                  <MessageBubble
                    msg={msg}
                    groupInfo={groupInfo}
                    onSwipeReply={setReplyingTo}
                    onScrollToReply={scrollToMessage}
                  />
                </div>
              </div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} style={{ height: "4px" }} />
      </div>

      {/* ── Input ──────────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 bg-surface-1/50 backdrop-blur-sm"
        style={{
          padding: "8px 12px",
          paddingBottom: "max(8px, env(safe-area-inset-bottom))",
          borderTop: "1px solid var(--surface-3, #334155)",
        }}
      >
        <AnimatePresence>
          {replyingTo && (
            <ReplyBanner
              replyingTo={replyingTo}
              onCancel={() => setReplyingTo(null)}
            />
          )}
        </AnimatePresence>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "8px",
            background: "var(--surface-2, #1e293b)",
            border: "1px solid var(--surface-3, #334155)",
            borderRadius: "14px",
            padding: "6px 6px 6px 12px",
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKey}
            placeholder="pull the thread…"
            rows={1}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              fontFamily: "'Outfit', sans-serif",
              fontSize: "13.5px",
              color: "#e2e8f0",
              caretColor: "#c7d2fe",
              lineHeight: "1.5",
              padding: "4px 0",
              maxHeight: "112px",
              overflowY: "auto",
              scrollbarWidth: "none",
            }}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.04 }}
            onClick={handleSend}
            disabled={!input.trim() || !connected}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              border: "1px solid rgba(99,102,241,0.3)",
              cursor: "pointer",
              background: "rgba(99,102,241,0.2)",
              color: "var(--brand, #6366f1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              opacity: !input.trim() || !connected ? 0.25 : 1,
              transition: "opacity 0.2s",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
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
        <p
          style={{
            fontSize: "9px",
            color: "#1e293b",
            textAlign: "center",
            marginTop: "4px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          only the two of you
        </p>
      </div>
    </div>
  );
} 