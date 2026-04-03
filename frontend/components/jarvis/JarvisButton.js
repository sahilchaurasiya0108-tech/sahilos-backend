"use client";
import { useRef } from "react";
import { Mic, MicOff, Loader2, Volume2 } from "lucide-react";
import { useJarvis } from "@/hooks/useJarvis";

const STATE_CONFIG = {
  idle: {
    label: "Jarvis",
    bg: "bg-surface-3 hover:bg-surface-2",
    ring: "",
    icon: <Mic size={16} className="text-slate-400" />,
    dot: null,
  },
  listening_for_wake: {
    label: "Listening…",
    bg: "bg-indigo-600/20 hover:bg-indigo-600/30",
    ring: "ring-2 ring-indigo-500/40",
    icon: <Mic size={16} className="text-indigo-400 animate-pulse" />,
    dot: "bg-indigo-400",
  },
  awake: {
    label: "I'm listening",
    bg: "bg-indigo-600",
    ring: "ring-2 ring-indigo-400",
    icon: <Mic size={16} className="text-white" />,
    dot: "bg-white animate-ping",
  },
  processing: {
    label: "Thinking…",
    bg: "bg-violet-600/30",
    ring: "ring-2 ring-violet-400/40",
    icon: <Loader2 size={16} className="text-violet-400 animate-spin" />,
    dot: null,
  },
  speaking: {
    label: "Speaking…",
    bg: "bg-emerald-600/20",
    ring: "ring-2 ring-emerald-400/40",
    icon: <Volume2 size={16} className="text-emerald-400" />,
    dot: "bg-emerald-400 animate-pulse",
  },
  error: {
    label: "Error",
    bg: "bg-red-600/20 hover:bg-red-600/30",
    ring: "ring-2 ring-red-400/40",
    icon: <MicOff size={16} className="text-red-400" />,
    dot: null,
  },
};

export default function JarvisButton() {
  const { state, transcript, reply, error, supported, activate, deactivate, tapToTalk } =
    useJarvis();

  const cfg = STATE_CONFIG[state] || STATE_CONFIG.idle;
  const isActive = state !== "idle";


  if (!supported) return null;

  return (
    <>
      {/* ── Floating button (bottom-right on mobile, bottom-left on desktop) ── */}
      <div className="fixed bottom-6 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-2">

        {/* Last transcript / reply bubble */}
        {(transcript || reply || error) && state !== "idle" && (
          <div className="max-w-xs rounded-2xl bg-surface-1 border border-surface-3 shadow-xl px-4 py-3 text-sm space-y-1 animate-in slide-in-from-bottom-2">
            {transcript && (
              <p className="text-slate-400 text-xs">
                <span className="text-slate-600 mr-1">You:</span>
                {transcript}
              </p>
            )}
            {reply && (
              <p className="text-slate-200">
                <span className="text-indigo-400 mr-1">Jarvis:</span>
                {reply}
              </p>
            )}
            {error && (
              <p className="text-red-400 text-xs">{error}</p>
            )}
          </div>
        )}

        {/* Main button */}
        <button
          onClick={isActive ? tapToTalk : activate}
          onContextMenu={(e) => {
            e.preventDefault();
            isActive ? deactivate() : activate();
          }}
          title={
            isActive
              ? 'Tap to talk • Right-click / long-press to turn off'
              : 'Tap to activate Jarvis'
          }
          className={`
            relative flex items-center gap-2 px-4 py-2.5 rounded-full
            text-sm font-medium transition-all duration-200 shadow-lg
            select-none cursor-pointer
            ${cfg.bg} ${cfg.ring}
          `}
        >
          {/* Pulse dot */}
          {cfg.dot && (
            <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
          )}

          {cfg.icon}
          <span className={`${state === "idle" ? "text-slate-500" : "text-slate-200"}`}>
            {cfg.label}
          </span>
        </button>

        {/* Wake word hint — only shown when active and idle-listening */}
        {state === "listening_for_wake" && (
          <p className="text-[10px] text-slate-600 text-center pr-1">
            Say "Hey Jarvis" or tap to talk
          </p>
        )}
      </div>
    </>
  );
}