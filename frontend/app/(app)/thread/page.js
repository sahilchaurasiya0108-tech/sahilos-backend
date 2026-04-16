"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { format, isToday, isYesterday } from "date-fns";
import { useRouter } from "next/navigation";

// ─── Constants ────────────────────────────────────────────────────────────────
const THREAD_SERVER =
  process.env.NEXT_PUBLIC_RED_THREAD_URL || "http://localhost:4000";
const USER_ID = "sahil"; // SahilOS is always Sahil
const LAST_SEEN_KEY = "sahilos_thread_last_seen_id";
const TYPING_DEBOUNCE_MS = 400;
const TYPING_STOP_DELAY_MS = 3000;

// ─── Loading lines ─────────────────────────────────────────────────────────────
const LOADING_LINES = [
  "wait… connecting the thread",
  "hold on… finding her",
  "this better be worth it",
  "loading… don't overthink it",
  "establishing the thread…",
  "let's see if she's here…",
  "opening something that matters…",
  "just a second… maybe…",
  "not like you're in a hurry…",
  "wait, wait... shehzadi sahiba",
  "the red thread, huh?",
];

const EXIT_LINES = [
  "leaving already?",
  "that was quick",
  "alright… later.",
  "thread stays.",
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Detect if user is on a touch/mobile device ───────────────────────────────
function isMobileDevice() {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
  );
}

// ─── useViewportHeight — tracks real visual viewport (keyboard-aware) ─────────
function useViewportHeight() {
  const [vh, setVh] = useState(null);

  useEffect(() => {
    const vv = window.visualViewport;

    function update() {
      const height = vv ? vv.height : window.innerHeight;
      const offsetTop = vv ? vv.offsetTop : 0;
      setVh({ height, offsetTop });
    }

    update();

    if (vv) {
      vv.addEventListener("resize", update);
      vv.addEventListener("scroll", update);
      return () => {
        vv.removeEventListener("resize", update);
        vv.removeEventListener("scroll", update);
      };
    } else {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
  }, []);

  return vh;
}

// ─── ThreadLoader ─────────────────────────────────────────────────────────────
function ThreadLoader({ onDone }) {
  const [line] = useState(() => randomFrom(LOADING_LINES));

  useEffect(() => {
    const t = setTimeout(onDone, 1200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      key="loader"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--surface-1, #0f172a)",
        gap: "16px",
      }}
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.75, 0.4] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: "var(--brand, #6366f1)",
        }}
      />
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: "12px",
          color: "#64748b",
          letterSpacing: "0.02em",
          margin: 0,
        }}
      >
        {line}
      </motion.p>
    </motion.div>
  );
}

// ─── Presence formatter ───────────────────────────────────────────────────────
function formatPresence(presence) {
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

  const sameAsPrev =
    prev && prev.sender === msg.sender && !shouldShowDivider(messages, index);
  const sameAsNext =
    next &&
    next.sender === msg.sender &&
    !shouldShowDivider(messages, index + 1);

  return {
    isFirst: !sameAsPrev,
    isLast: !sameAsNext,
    isMid: sameAsPrev && sameAsNext,
  };
}

// ─── MessageTicks ─────────────────────────────────────────────────────────────
const MessageTicks = memo(function MessageTicks({ seen }) {
  return (
    <span
      style={{
        fontSize: "9px",
        color: seen ? "var(--brand, #6366f1)" : "#475569",
        opacity: seen ? 0.6 : 0.4,
        letterSpacing: "-1px",
        lineHeight: 1,
        userSelect: "none",
        transition: "color 0.4s ease, opacity 0.4s ease",
      }}
      title={seen ? "Seen" : "Sent"}
    >
      {seen ? "✓✓" : "✓"}
    </span>
  );
});

// ─── TypingIndicator ──────────────────────────────────────────────────────────
const TypingIndicator = memo(function TypingIndicator({ isTyping }) {
  return (
    <AnimatePresence>
      {isTyping && (
        <motion.div
          key="typing"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{
            padding: "2px 4px 6px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "11px",
              color: "#475569",
              fontStyle: "italic",
              letterSpacing: "0.01em",
            }}
          >
            She's typing…
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// ─── useRedThread hook ────────────────────────────────────────────────────────
function useRedThread() {
  const [messages, setMessages] = useState([]);
  const [otherPresence, setOtherPresence] = useState({
    status: "unknown",
    lastSeen: null,
  });
  const [connected, setConnected] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const socketRef = useRef(null);
  const typingStopTimerRef = useRef(null);

  // ── Typing emit state — all in refs to avoid stale closures ──────────────
  const isTypingEmittedRef = useRef(false);
  const typingDebounceRef = useRef(null);
  const typingStopRef = useRef(null);

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

    socket.on("disconnect", () => {
      setConnected(false);
      setIsOtherTyping(false);
    });

    socket.on("threadHistory", ({ messages }) => {
      setMessages(messages);
      setHistoryLoaded(true);
      socket.emit("messageSeen", { viewer: USER_ID });
    });

    socket.on("threadMoved", ({ message }) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
      if (message.sender !== USER_ID) {
        setTimeout(() => {
          socket.emit("messageSeen", { viewer: USER_ID });
        }, 300);
      }
      if (message.sender !== USER_ID) {
        setIsOtherTyping(false);
      }
    });

    socket.on("presence", ({ userId, status, lastSeen }) => {
      if (userId !== USER_ID) setOtherPresence({ status, lastSeen });
    });

    socket.on("typing", ({ sender }) => {
      if (sender !== USER_ID) {
        setIsOtherTyping(true);
        clearTimeout(typingStopTimerRef.current);
        typingStopTimerRef.current = setTimeout(() => {
          setIsOtherTyping(false);
        }, TYPING_STOP_DELAY_MS + 500);
      }
    });

    socket.on("stopTyping", ({ sender }) => {
      if (sender !== USER_ID) {
        clearTimeout(typingStopTimerRef.current);
        setIsOtherTyping(false);
      }
    });

    socket.on("messagesSeenUpdate", ({ messageIds }) => {
      const idSet = new Set(messageIds);
      setMessages((prev) =>
        prev.map((m) =>
          idSet.has(String(m._id)) ? { ...m, seen: true } : m
        )
      );
    });

    return () => {
      clearTimeout(typingStopTimerRef.current);
      clearTimeout(typingDebounceRef.current);
      clearTimeout(typingStopRef.current);
      socket.disconnect();
    };
  }, []);

  const sendMessage = useCallback((text, replyTo = null) => {
    if (!socketRef.current || !text?.trim()) return;

    // ── Stop typing immediately on send ──────────────────────────────────
    clearTimeout(typingDebounceRef.current);
    clearTimeout(typingStopRef.current);
    if (isTypingEmittedRef.current) {
      socketRef.current.emit("stopTyping", { sender: USER_ID });
      isTypingEmittedRef.current = false;
    }

    socketRef.current.emit("threadMoved", {
      sender: USER_ID,
      text: text.trim(),
      replyTo: replyTo
        ? { _id: replyTo._id, text: replyTo.text, sender: replyTo.sender }
        : null,
    });
  }, []);

  // ── notifyTyping — called on every keystroke ──────────────────────────────
  // Fix: emit "typing" once on first keystroke (debounced), then keep the
  // stop-timer rolling on every subsequent keystroke so it only fires after
  // the user truly stops.  The flag is only reset when stopTyping is actually
  // emitted, preventing the flicker caused by the flag being cleared too early.
  const notifyTyping = useCallback(() => {
    if (!socketRef.current) return;

    // Always push the stop-timer forward — fires only after real inactivity
    clearTimeout(typingStopRef.current);
    typingStopRef.current = setTimeout(() => {
      if (isTypingEmittedRef.current && socketRef.current) {
        socketRef.current.emit("stopTyping", { sender: USER_ID });
        isTypingEmittedRef.current = false;
      }
    }, TYPING_STOP_DELAY_MS);

    // Emit "typing" start once, debounced — don't re-emit while already typing
    if (!isTypingEmittedRef.current) {
      // Set the flag optimistically before the debounce fires so rapid
      // keystrokes don't schedule multiple debounced emits
      clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.emit("typing", { sender: USER_ID });
          isTypingEmittedRef.current = true;
        }
      }, TYPING_DEBOUNCE_MS);
    }
  }, []);

  const markSeen = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("messageSeen", { viewer: USER_ID });
    }
    fetch(`${THREAD_SERVER}/thread/messages/seen`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewer: USER_ID }),
    }).catch(() => {});
  }, []);

  return {
    messages,
    otherPresence,
    connected,
    sendMessage,
    markSeen,
    historyLoaded,
    isOtherTyping,
    notifyTyping,
  };
}

// ─── ReplyPreview ─────────────────────────────────────────────────────────────
const ReplyPreview = memo(function ReplyPreview({ replyTo, isMine, onScrollTo }) {
  if (!replyTo?._id) return null;
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
          borderLeft: `2px solid ${
            isMine ? "rgba(199,210,254,0.4)" : "var(--brand, #6366f1)"
          }`,
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
              overflowWrap: "break-word",
            }}
          >
            {msg.text}
          </p>
        </div>
      </div>

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
          {isMine && <MessageTicks seen={!!msg.seen} />}
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
  const {
    messages,
    otherPresence,
    connected,
    sendMessage,
    markSeen,
    historyLoaded,
    isOtherTyping,
    notifyTyping,
  } = useRedThread();
  const router = useRouter();
  const viewport = useViewportHeight();

  const [input, setInput] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);

  // ── Entrance / exit state ──
  const [phase, setPhase] = useState("loading");
  const [exitLine] = useState(() => randomFrom(EXIT_LINES));

  // ── Unread / new-messages state ───────────────────────────────────────────
  const [firstUnreadIndex, setFirstUnreadIndex] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNewMsgsDivider, setShowNewMsgsDivider] = useState(false);
  const [floatingUnread, setFloatingUnread] = useState(0);
  const [showFloating, setShowFloating] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const messageRefs = useRef({});
  const unreadDividerRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const initialScrollDoneRef = useRef(false);
  const prevMessageCountRef = useRef(0);
  const isMobileRef = useRef(false);

  useEffect(() => {
    isMobileRef.current = isMobileDevice();
  }, []);

  // ── Build shell style using real visual viewport ──────────────────────────
  const shellStyle = viewport
    ? {
        position: "fixed",
        top: `${viewport.offsetTop}px`,
        left: 0,
        right: 0,
        height: `${viewport.height}px`,
        zIndex: 50,
      }
    : {
        position: "fixed",
        inset: 0,
        zIndex: 50,
      };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getIsAtBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 50;
  }, []);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  const saveLastSeen = useCallback(() => {
    if (messages.length > 0) {
      const lastId = messages[messages.length - 1]._id;
      if (lastId) localStorage.setItem(LAST_SEEN_KEY, lastId);
    }
  }, [messages]);

  // ── Save on leave ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") saveLastSeen();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      saveLastSeen();
    };
  }, [saveLastSeen]);

  // ── Scroll listener ───────────────────────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const atBottom = getIsAtBottom();
      isAtBottomRef.current = atBottom;

      if (atBottom) {
        setShowFloating(false);
        setFloatingUnread(0);
        if (showNewMsgsDivider) {
          setShowNewMsgsDivider(false);
          setFirstUnreadIndex(null);
          setUnreadCount(0);
          saveLastSeen();
        }
      }

      if (showNewMsgsDivider && unreadDividerRef.current) {
        const dividerRect = unreadDividerRef.current.getBoundingClientRect();
        const containerRect = el.getBoundingClientRect();
        if (dividerRect.bottom < containerRect.top) {
          setShowNewMsgsDivider(false);
          setFirstUnreadIndex(null);
          setUnreadCount(0);
          saveLastSeen();
        }
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [getIsAtBottom, showNewMsgsDivider, saveLastSeen]);

  // ── Initial scroll when history loads + phase is open ────────────────────
  useEffect(() => {
    if (!historyLoaded || initialScrollDoneRef.current) return;
    if (phase !== "open") return;

    const lastSeenId =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(LAST_SEEN_KEY)
        : null;

    if (!lastSeenId || messages.length === 0) {
      requestAnimationFrame(() => scrollToBottom("instant"));
      initialScrollDoneRef.current = true;
      prevMessageCountRef.current = messages.length;
      return;
    }

    const lastSeenIdx = messages.findIndex((m) => m._id === lastSeenId);

    if (lastSeenIdx === -1 || lastSeenIdx === messages.length - 1) {
      requestAnimationFrame(() => scrollToBottom("instant"));
    } else {
      const firstUnread = lastSeenIdx + 1;
      const count = messages.length - firstUnread;
      setFirstUnreadIndex(firstUnread);
      setUnreadCount(count);
      setShowNewMsgsDivider(true);

      requestAnimationFrame(() => {
        if (unreadDividerRef.current) {
          unreadDividerRef.current.scrollIntoView({
            behavior: "instant",
            block: "start",
          });
        } else {
          scrollToBottom("instant");
        }
      });
    }

    initialScrollDoneRef.current = true;
    prevMessageCountRef.current = messages.length;
  }, [historyLoaded, phase, messages, scrollToBottom]);

  // ── Handle incoming new messages after initial load ───────────────────────
  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    const newCount = messages.length;

    if (!initialScrollDoneRef.current || newCount <= prevCount) {
      prevMessageCountRef.current = newCount;
      return;
    }

    const atBottom = isAtBottomRef.current;
    const newMsgCount = newCount - prevCount;

    if (atBottom) {
      requestAnimationFrame(() => scrollToBottom("smooth"));
      setShowFloating(false);
      setFloatingUnread(0);
    } else {
      setFloatingUnread((prev) => prev + newMsgCount);
      setShowFloating(true);
    }

    prevMessageCountRef.current = newCount;
  }, [messages, scrollToBottom]);

  // ── Auto-scroll when typing indicator appears at bottom ───────────────────
  useEffect(() => {
    if (isOtherTyping && isAtBottomRef.current) {
      requestAnimationFrame(() => scrollToBottom("smooth"));
    }
  }, [isOtherTyping, scrollToBottom]);

  // Loader → entering → open
  const handleLoaderDone = useCallback(() => {
    setPhase("entering");
    setTimeout(() => setPhase("open"), 400);
  }, []);

  const handleClose = useCallback(() => {
    saveLastSeen();
    setPhase("closing");
    setTimeout(() => router.back(), 600);
  }, [router, saveLastSeen]);

  // ── Textarea auto-expand ──────────────────────────────────────────────────
  const handleInputChange = (e) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    // Always notify typing as long as there's any input (including mid-deletion)
    notifyTyping();
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    setShowNewMsgsDivider(false);
    setFirstUnreadIndex(null);
    setUnreadCount(0);
    setShowFloating(false);
    setFloatingUnread(0);

    sendMessage(text, replyingTo);
    setInput("");
    setReplyingTo(null);
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.focus();
    }
    setTimeout(() => scrollToBottom("smooth"), 50);
  };

  const handleKey = (e) => {
    // On mobile: Enter always inserts a newline — send button only
    // On desktop: Enter sends, Shift+Enter inserts newline
    if (e.key === "Enter") {
      if (isMobileRef.current) {
        // Let the browser insert the newline naturally — do nothing here
        return;
      }
      if (!e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
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

  const handleFloatingClick = () => {
    scrollToBottom("smooth");
    setShowFloating(false);
    setFloatingUnread(0);
    setShowNewMsgsDivider(false);
    setFirstUnreadIndex(null);
    setUnreadCount(0);
    saveLastSeen();
  };

  useEffect(() => {
    if (messages.length > 0) {
      markSeen();
    }
  }, [messages, markSeen]);

  const presenceText = formatPresence(otherPresence);
  const isHere = otherPresence.status === "here";

  return (
    <>
      {/* ── Loading screen ── */}
      <AnimatePresence>
        {phase === "loading" && <ThreadLoader onDone={handleLoaderDone} />}
      </AnimatePresence>

      {/* ── Exit overlay ── */}
      <AnimatePresence>
        {phase === "closing" && (
          <motion.div
            key="exit-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 90,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              background: "var(--surface-1, #0f172a)",
            }}
          >
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 0.4, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 }}
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "12px",
                color: "#64748b",
                letterSpacing: "0.02em",
              }}
            >
              {exitLine}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main chat shell ── */}
      <AnimatePresence>
        {(phase === "entering" || phase === "open") && (
          <motion.div
            key="chat-shell"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{
              duration: phase === "entering" ? 0.35 : 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{
              ...shellStyle,
              display: "flex",
              flexDirection: "column",
              background: "var(--surface-1, #0f172a)",
              maxWidth: "672px",
              marginLeft: "auto",
              marginRight: "auto",
              willChange: "transform, opacity",
            }}
          >
            {/* ── Header ── */}
            <div
              style={{
                flexShrink: 0,
                zIndex: 10,
                background: "rgba(15,23,42,0.85)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                padding: "10px 16px",
                borderBottom: "1px solid var(--surface-3, #334155)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={handleClose}
                  aria-label="Close thread"
                  style={{
                    background: "none",
                    border: "none",
                    padding: "4px 6px 4px 0",
                    cursor: "pointer",
                    color: "#64748b",
                    fontSize: "15px",
                    lineHeight: 1,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#94a3b8")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#64748b")
                  }
                >
                  ✕
                </motion.button>

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
                    transition={
                      isHere ? { duration: 2, repeat: Infinity } : {}
                    }
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
                    key={isOtherTyping ? "typing" : presenceText}
                    initial={{ opacity: 0, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      fontSize: "10px",
                      color: isOtherTyping ? "#94a3b8" : isHere ? "#4ade80" : "#64748b",
                      fontStyle: "italic",
                      margin: 0,
                    }}
                  >
                    {isOtherTyping ? "She's typing…" : presenceText}
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

            {/* ── Messages ── */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                padding: "8px 14px 4px",
                scrollbarWidth: "thin",
                overscrollBehavior: "contain",
                minHeight: 0,
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
                  const isFirstUnread =
                    showNewMsgsDivider && i === firstUnreadIndex;

                  return (
                    <div key={msg._id || i}>
                      {/* ── Date divider ── */}
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

                      {/* ── New messages divider ── */}
                      {isFirstUnread && (
                        <motion.div
                          ref={unreadDividerRef}
                          initial={{ opacity: 0, scaleX: 0.85 }}
                          animate={{ opacity: 1, scaleX: 1 }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            margin: "12px 0 4px",
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                              height: "1px",
                              background: "var(--brand, #6366f1)",
                              opacity: 0.3,
                            }}
                          />
                          <span
                            style={{
                              fontSize: "9px",
                              textTransform: "uppercase",
                              letterSpacing: "0.12em",
                              color: "var(--brand, #6366f1)",
                              fontFamily: "'Outfit', sans-serif",
                              fontWeight: 500,
                              whiteSpace: "nowrap",
                              padding: "2px 8px",
                              borderRadius: "20px",
                              background: "rgba(99,102,241,0.1)",
                              border: "1px solid rgba(99,102,241,0.25)",
                            }}
                          >
                            {unreadCount} new{" "}
                            {unreadCount === 1 ? "message" : "messages"}
                          </span>
                          <div
                            style={{
                              flex: 1,
                              height: "1px",
                              background: "var(--brand, #6366f1)",
                              opacity: 0.3,
                            }}
                          />
                        </motion.div>
                      )}

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

              {/* ── Typing indicator (in message stream) ── */}
              <TypingIndicator isTyping={isOtherTyping} />

              <div ref={bottomRef} style={{ height: "4px" }} />
            </div>

            {/* ── Floating "↓ N new messages" pill ── */}
            <AnimatePresence>
              {showFloating && floatingUnread > 0 && (
                <motion.button
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  onClick={handleFloatingClick}
                  style={{
                    position: "absolute",
                    bottom: "72px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 30,
                    background: "var(--brand, #6366f1)",
                    border: "none",
                    borderRadius: "20px",
                    padding: "6px 14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      color: "white",
                      fontWeight: 600,
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    ↓ {floatingUnread} new{" "}
                    {floatingUnread === 1 ? "message" : "messages"}
                  </span>
                </motion.button>
              )}
            </AnimatePresence>

            {/* ── Input bar ── */}
            <div
              style={{
                flexShrink: 0,
                background: "rgba(15,23,42,0.6)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                padding: "8px 12px",
                paddingBottom: "env(safe-area-inset-bottom, 8px)",
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
                    maxHeight: "120px",
                    overflowY: "auto",
                    scrollbarWidth: "none",
                    transition: "height 0.1s ease",
                    whiteSpace: "pre-wrap",
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}