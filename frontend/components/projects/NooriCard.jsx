"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import {
  Edit2, Trash2, GitBranch, Globe, CheckCircle, Circle, ChevronRight
} from "lucide-react";
import { Badge, ProgressBar } from "@/components/ui";
import { PROJECT_STATUSES, PROJECT_CATEGORIES } from "@/lib/constants";
import clsx from "clsx";

// ── Poetic lines that whisper on hover ────────────────────────────────────────
const NOORI_WHISPERS = [
  "A quiet little universe...",
  "It listens. It remembers. It stays.",
  "Some things are not meant to be opened.",
  "She needed a place. So one was made.",
  "Not built to be used. Built to be felt.",
  "Some days it's a diary. Some days it's just… there.",
  "Her thoughts rest here.",
  "A universe of one.",
];

const statusMeta = (v) => PROJECT_STATUSES.find((s) => s.value === v);

// ── NooriCard ─────────────────────────────────────────────────────────────────
export default function NooriCard({ project, onView, onEdit, onDelete, onMilestoneToggle }) {
  const status  = statusMeta(project.status);
  const done    = project.milestones?.filter((m) => m.done).length || 0;

  // ── State ──────────────────────────────────────────────────────────────────
  const [isHovered,   setIsHovered]   = useState(false);
  const [whisper,     setWhisper]     = useState("");
  const [audioReady,  setAudioReady]  = useState(false);
  const [userTouched, setUserTouched] = useState(false); // browser autoplay guard

  // ── Refs ───────────────────────────────────────────────────────────────────
  const cardRef      = useRef(null);
  const audioRef     = useRef(null);
  const rafRef       = useRef(null);
  const glowRef      = useRef(null);

  // ── Mouse-follow glow (spring-smoothed) ───────────────────────────────────
  const rawX = useMotionValue(0.5);
  const rawY = useMotionValue(0.5);
  const glowX = useSpring(rawX, { stiffness: 120, damping: 20 });
  const glowY = useSpring(rawY, { stiffness: 120, damping: 20 });

  // Sync spring values → inline style on glow layer (avoids React re-renders)
  useEffect(() => {
    const unsubX = glowX.on("change", () => updateGlow());
    const unsubY = glowY.on("change", () => updateGlow());
    return () => { unsubX(); unsubY(); };
  }, []);

  const updateGlow = useCallback(() => {
    if (!glowRef.current) return;
    const x = glowX.get() * 100;
    const y = glowY.get() * 100;
    glowRef.current.style.background =
      `radial-gradient(circle at ${x}% ${y}%, rgba(124,58,237,0.22) 0%, rgba(192,132,252,0.07) 40%, transparent 70%)`;
  }, []);

  const handleMouseMove = useCallback((e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left) / rect.width);
    rawY.set((e.clientY - rect.top)  / rect.height);
  }, []);

  // ── Audio ──────────────────────────────────────────────────────────────────
  // Soft wind-chime synthesized via Web Audio API — zero external file needed
  const playAmbient = useCallback(() => {
    if (!userTouched) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.5, 880, 698.46]; // C5 E5 G5 C6 A5 F5

      notes.forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "sine";
        osc.frequency.value = freq;

        const start = ctx.currentTime + i * 0.18 + Math.random() * 0.1;
        const dur   = 1.8 + Math.random() * 0.8;

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.04, start + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

        osc.start(start);
        osc.stop(start + dur);
      });
    } catch (_) { /* AudioContext blocked — silently skip */ }
  }, [userTouched]);

  // ── Hover handlers ─────────────────────────────────────────────────────────
  const handleMouseEnter = useCallback((e) => {
    setUserTouched(true);
    setIsHovered(true);
    // Pick a fresh random whisper
    const pool = NOORI_WHISPERS.filter((w) => w !== whisper);
    setWhisper(pool[Math.floor(Math.random() * pool.length)]);
    playAmbient();
    // Center glow on entry
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      rawX.set((e.clientX - rect.left) / rect.width);
      rawY.set((e.clientY - rect.top)  / rect.height);
    }
  }, [whisper, playAmbient]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    // Drift glow back to centre
    rawX.set(0.5);
    rawY.set(0.5);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      ref={cardRef}
      // ── Breathing animation ───────────────────────────────────────────────
      animate={{ scale: isHovered ? 1.015 : [1, 1.008, 1] }}
      transition={isHovered
        ? { duration: 0.35, ease: "easeOut" }
        : { duration: 5, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }
      }
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onClick={() => onView(project)}
      className="relative overflow-hidden cursor-pointer rounded-xl
                 bg-surface-1 border border-purple-900/40
                 shadow-[0_0_0_1px_rgba(124,58,237,0.08),0_4px_24px_rgba(0,0,0,0.4)]
                 flex flex-col gap-3 p-5 group
                 hover:border-purple-700/60
                 hover:shadow-[0_0_0_1px_rgba(124,58,237,0.18),0_8px_40px_rgba(124,58,237,0.12)]
                 transition-shadow duration-500"
      style={{ willChange: "transform" }}
    >
      {/* ── Mouse-follow glow layer ──────────────────────────────────────── */}
      <div
        ref={glowRef}
        className="absolute inset-0 pointer-events-none rounded-xl transition-opacity duration-500"
        style={{ opacity: isHovered ? 1 : 0 }}
      />

      {/* ── Subtle noise / grain overlay ─────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none rounded-xl opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "180px",
        }}
      />

      {/* ── Lock overlay on hover ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 z-20 rounded-xl flex flex-col items-center justify-center gap-3 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at center, rgba(10,5,25,0.72) 0%, rgba(10,5,25,0.55) 100%)",
              backdropFilter: "blur(2px)",
            }}
          >
            {/* Lock icon */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 6 }}
              animate={{ scale: 1,   opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.45, ease: [0.34,1.56,0.64,1] }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke="rgba(192,132,252,0.85)" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </motion.div>

            {/* Whisper text */}
            <AnimatePresence mode="wait">
              <motion.p
                key={whisper}
                initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{    opacity: 0, y: -6, filter: "blur(3px)" }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="text-xs text-purple-300/80 text-center px-6 leading-relaxed"
                style={{ fontFamily: "'Dancing Script', cursive", fontSize: "0.85rem", letterSpacing: "0.02em" }}
              >
                {whisper}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Edit / Delete actions ─────────────────────────────────────────── */}
      <div
        className="absolute top-4 right-4 z-30 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onEdit(project)}
          className="p-1.5 rounded-md text-purple-400/60 hover:text-purple-300 hover:bg-purple-900/30 transition-colors"
        >
          <Edit2 size={13} />
        </button>
        <button
          onClick={() => onDelete(project._id)}
          className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* ── Card content (z-10 so it sits above glow but below overlay) ───── */}
      <div className="relative z-10 flex flex-col gap-3">

        {/* Title row */}
        <div className="flex items-center gap-3 min-w-0 pr-14">
          {/* Moon dot instead of plain color dot */}
          <motion.span
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-[11px] shrink-0"
          >
            🌙
          </motion.span>
          <p
            className="font-semibold truncate text-purple-100"
            style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: "0.01em" }}
          >
            {project.title}
          </p>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-xs text-purple-300/50 line-clamp-2 italic leading-relaxed">
            {project.description}
          </p>
        )}

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {status && <Badge className={clsx(status.color, "opacity-80")}>{status.label}</Badge>}
          {project.categories?.map((cat) => {
            const meta = PROJECT_CATEGORIES.find((c) => c.value === cat);
            return meta ? (
              <span key={cat} className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium opacity-75", meta.color)}>
                {meta.icon} {meta.label}
              </span>
            ) : null;
          })}
          {project.repoLink && (
            <a href={project.repoLink} target="_blank" rel="noopener noreferrer"
              className="text-xs text-purple-400/60 hover:text-purple-300 flex items-center gap-1 z-30"
              onClick={(e) => e.stopPropagation()}>
              <GitBranch size={11} />Repo
            </a>
          )}
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-purple-400/60 hover:text-purple-300 flex items-center gap-1 z-30"
              onClick={(e) => e.stopPropagation()}>
              <Globe size={11} />Live
            </a>
          )}
        </div>

        {/* Progress — custom purple bar */}
        <div>
          <div className="flex justify-between text-[11px] text-purple-300/40 mb-1.5">
            <span>Progress</span><span>{project.progress}%</span>
          </div>
          <div className="h-1 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #7c3aed, #c084fc)" }}
              initial={{ width: 0 }}
              animate={{ width: `${project.progress}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Milestones */}
        {project.milestones?.length > 0 && (
          <div className="space-y-1.5">
            {project.milestones.slice(0, 3).map((m) => (
              <div
                key={m._id}
                onClick={(e) => { e.stopPropagation(); onMilestoneToggle(project._id, m._id); }}
                className="flex items-center gap-2 text-xs text-purple-300/50 hover:text-purple-200 cursor-pointer transition-colors z-30"
              >
                {m.done
                  ? <CheckCircle size={12} className="text-purple-400 shrink-0" />
                  : <Circle size={12} className="shrink-0 text-purple-800/60" />}
                <span className={m.done ? "line-through text-purple-500/40" : ""}>{m.title}</span>
              </div>
            ))}
            {project.milestones.length > 3 && (
              <p className="text-xs text-purple-600/50 flex items-center gap-1">
                +{project.milestones.length - 3} more <ChevronRight size={10} />
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom right "View" hint ──────────────────────────────────────── */}
      <div className="absolute bottom-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="text-[10px] text-purple-500/50 flex items-center gap-0.5">
          View <ChevronRight size={9} />
        </span>
      </div>

      {/* ── Vignette border glow ──────────────────────────────────────────── */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-700"
        style={{
          boxShadow: "inset 0 0 60px rgba(124,58,237,0.07)",
          opacity: isHovered ? 1 : 0.4,
        }}
      />
    </motion.div>
  );
}