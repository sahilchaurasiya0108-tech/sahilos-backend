"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, User, Bot, RefreshCw } from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import PageWrapper from "@/components/layout/PageWrapper";
import api from "@/lib/api";
import clsx from "clsx";
import { format } from "date-fns";

// ── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={clsx("flex gap-3 animate-slide-up", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={clsx(
          "h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-sm",
          isUser ? "bg-brand/20 text-brand" : "bg-surface-3 text-slate-400"
        )}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      {/* Bubble */}
      <div
        className={clsx(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-brand/20 text-slate-100 rounded-tr-sm"
            : "bg-surface-2 text-slate-200 rounded-tl-sm border border-surface-3"
        )}
      >
        {/* Render newlines and basic markdown-style bullets */}
        {message.content.split("\n").map((line, i) => (
          <p key={i} className={line.startsWith("•") || line.startsWith("-") ? "ml-2" : ""}>
            {line || <br />}
          </p>
        ))}
        <p className="text-xs text-slate-600 mt-1.5">
          {format(new Date(message.ts), "h:mm a")}
        </p>
      </div>
    </div>
  );
}

// ── Suggestion Chip ───────────────────────────────────────────────────────────
function SuggestionChip({ text, onClick }) {
  return (
    <button
      onClick={() => onClick(text)}
      className="px-3 py-1.5 rounded-full text-xs bg-surface-2 border border-surface-3
                 text-slate-400 hover:text-brand hover:border-brand/40 transition-all text-left"
    >
      {text}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const WELCOME_MESSAGE = {
  role: "assistant",
  content:
    "Hi! I'm your SahilOS AI assistant. I have access to all your portal data — tasks, habits, journal, budget, learning, and more.\n\nAsk me anything about your life dashboard!",
  ts: new Date().toISOString(),
};

export default function AIPage() {
  const [messages, setMessages]   = useState([WELCOME_MESSAGE]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Load suggestions on mount
  useEffect(() => {
    api.get("/ai/suggestions")
      .then((res) => setSuggestions(res.data.data))
      .catch(() => {});
  }, []);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const question = (text || input).trim();
    if (!question || loading) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: question, ts: new Date().toISOString() },
    ]);
    setLoading(true);

    try {
      const res = await api.post("/ai/query", { question });
      const answer = res.data.data.answer;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: answer, ts: new Date().toISOString() },
      ]);
    } catch (err) {
      const errMsg = err.response?.data?.message || "Something went wrong. Please try again.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ ${errMsg}`, ts: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => setMessages([WELCOME_MESSAGE]);

  return (
    <PageWrapper className="flex flex-col p-0 overflow-hidden">
      <div className="flex flex-col h-full max-w-3xl mx-auto w-full px-4 sm:px-6">

        {/* Header */}
        <div className="flex items-center justify-between py-4 border-b border-surface-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-brand/15 flex items-center justify-center">
              <Sparkles size={16} className="text-brand" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-100">AI Assistant</h1>
              <p className="text-xs text-slate-500">Aware of all your portal data</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={clearChat} title="Clear chat">
            <RefreshCw size={14} />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-5 space-y-4">
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="h-8 w-8 rounded-full bg-surface-3 flex items-center justify-center shrink-0">
                <Bot size={14} className="text-slate-400" />
              </div>
              <div className="bg-surface-2 border border-surface-3 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggestions (only shown at start) */}
        {messages.length <= 1 && suggestions.length > 0 && (
          <div className="pb-3 shrink-0">
            <p className="text-xs text-slate-600 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 6).map((s, i) => (
                <SuggestionChip key={i} text={s} onClick={sendMessage} />
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="pb-4 shrink-0">
          <div className="flex gap-2 bg-surface-2 border border-surface-3 rounded-2xl p-2 focus-within:border-brand/40 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your dashboard…"
              rows={1}
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-600 resize-none focus:outline-none px-2 py-1.5 max-h-32"
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className={clsx(
                "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all",
                input.trim() && !loading
                  ? "bg-brand text-white hover:bg-brand-dark"
                  : "bg-surface-3 text-slate-600 cursor-not-allowed"
              )}
            >
              {loading ? <Spinner size="sm" /> : <Send size={14} />}
            </button>
          </div>
          <p className="text-xs text-slate-700 text-center mt-1.5">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
