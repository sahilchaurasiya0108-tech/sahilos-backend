"use client";
/**
 * ThreadPushPrompt — SahilOS
 *
 * A minimal, non-intrusive banner shown at the top of the /thread page
 * until Sahil enables push notifications (or dismisses it).
 *
 * Tone: dry, casual — matches SahilOS voice.
 * After enabling, the Red Thread server will push to this device
 * when Gauri messages and the app is closed.
 */

import { useState, useEffect } from "react";
import { usePushForThread } from "@/hooks/usePushForThread";

const DISMISS_KEY = "sahilos_thread_push_prompt_dismissed";

export default function ThreadPushPrompt() {
  const { supported, subscribed, permission, loading, error, subscribe } =
    usePushForThread();

  const [dismissed, setDismissed] = useState(
    () =>
      typeof localStorage !== "undefined" &&
      localStorage.getItem(DISMISS_KEY) === "true"
  );

  const shouldShow =
    supported && !subscribed && permission !== "denied" && !dismissed;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  if (!shouldShow) return null;

  return (
    <div
      style={{
        margin: "0 0 0 0",
        padding: "8px 14px",
        background: "rgba(239,68,68,0.05)",
        borderBottom: "1px solid rgba(239,68,68,0.1)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <p
        style={{
          flex: 1,
          fontFamily: "'Outfit', sans-serif",
          fontSize: "11px",
          color: "#64748b",
          margin: 0,
          letterSpacing: "0.01em",
        }}
      >
        {error
          ? `couldn't enable — ${error}`
          : "get notified when she messages, even when this is closed"}
      </p>

      <button
        onClick={subscribe}
        disabled={loading}
        style={{
          background: "rgba(239,68,68,0.15)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: "6px",
          color: "#f87171",
          fontFamily: "'Outfit', sans-serif",
          fontSize: "11px",
          padding: "4px 10px",
          cursor: loading ? "wait" : "pointer",
          opacity: loading ? 0.6 : 1,
          whiteSpace: "nowrap",
          transition: "opacity 0.15s",
        }}
      >
        {loading ? "…" : "enable"}
      </button>

      <button
        onClick={handleDismiss}
        style={{
          background: "none",
          border: "none",
          color: "#475569",
          fontSize: "12px",
          cursor: "pointer",
          padding: "2px 4px",
          lineHeight: 1,
        }}
        aria-label="dismiss"
      >
        ✕
      </button>
    </div>
  );
}
