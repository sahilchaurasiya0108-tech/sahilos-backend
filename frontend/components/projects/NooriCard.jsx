"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  motion, AnimatePresence,
  useMotionValue, useSpring,
} from "framer-motion";
import {
  Edit2, Trash2, GitBranch, Globe,
  CheckCircle, Circle, ChevronRight,
  X, ExternalLink, Target, BarChart3,
  Calendar, Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui";
import { PROJECT_STATUSES, PROJECT_CATEGORIES } from "@/lib/constants";
import api from "@/lib/api";
import clsx from "clsx";

// ─────────────────────────────────────────────────────────────────────────────
// Palette — explicit RGB values, no hex-opacity tricks
// ─────────────────────────────────────────────────────────────────────────────
const N = {
  void:       "#0d0810",
  deep:       "#180d1c",
  bloom:      "#7c2d9e",
  // Full-opacity readable colors
  petal:      "rgb(221,160,221)",          // plum blossom
  rose:       "rgb(242,196,232)",          // soft rose
  gold:       "rgb(232,192,122)",          // warm gold
  // Dimmed variants using rgba — explicit, predictable
  petalDim:   "rgba(221,160,221,0.55)",
  petalMuted: "rgba(221,160,221,0.35)",
  roseDim:    "rgba(242,196,232,0.60)",
  roseMuted:  "rgba(242,196,232,0.40)",
  goldDim:    "rgba(232,192,122,0.65)",
  // Borders
  border:     "rgba(221,160,221,0.10)",
  borderHot:  "rgba(221,160,221,0.28)",
};

const WHISPERS = [
  "a universe made just for her.",
  "she needed a place. so one was built.",
  "it listens. it remembers. it stays.",
  "some things are too gentle for the world.",
  "her thoughts rest here, always.",
  "not built to impress. built to hold.",
  "every corner carries her name.",
  "a quiet love, made visible.",
];

const FLOATERS = ["✦", "✧", "⋆", "·", "✦", "✧"];
const statusMeta = (v) => PROJECT_STATUSES.find((s) => s.value === v);

// ─────────────────────────────────────────────────────────────────────────────
// Singing bowl sound — soothing, peaceful
// ─────────────────────────────────────────────────────────────────────────────
function playSingingBowl() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    // Fundamental + overtones of a Tibetan bowl
    [
      { f: 220,  g: 0.055, d: 3.5 },
      { f: 440,  g: 0.032, d: 3.0 },
      { f: 660,  g: 0.018, d: 2.5 },
      { f: 880,  g: 0.010, d: 2.0 },
      { f: 1320, g: 0.005, d: 1.5 },
    ].forEach(({ f, g, d }, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      const pan  = ctx.createStereoPanner();
      osc.connect(gain); gain.connect(pan); pan.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = f;
      pan.pan.value = (i % 2 === 0 ? -0.12 : 0.12);
      const t = now + i * 0.035;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(g, t + 0.07);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + d);
      osc.start(t); osc.stop(t + d + 0.1);
    });
    // Soft breath swell
    const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.45, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.01;
    const src = ctx.createBufferSource();
    const bpf = ctx.createBiquadFilter();
    const bg  = ctx.createGain();
    src.buffer = buf;
    bpf.type = "bandpass"; bpf.frequency.value = 300; bpf.Q.value = 2.5;
    src.connect(bpf); bpf.connect(bg); bg.connect(ctx.destination);
    bg.gain.setValueAtTime(0, now);
    bg.gain.linearRampToValueAtTime(0.016, now + 0.14);
    bg.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    src.start(now); src.stop(now + 0.5);
  } catch (_) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating particle
// ─────────────────────────────────────────────────────────────────────────────
function Floater({ x, delay, symbol, drift }) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none text-[10px]"
      style={{ left: `${x}%`, bottom: "12%", color: N.rose }}
      initial={{ opacity: 0, y: 0, x: 0 }}
      animate={{ opacity: [0, 0.6, 0], y: -60, x: drift }}
      transition={{ duration: 3, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {symbol}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Constellation — delicate stars drawn on hover
// ─────────────────────────────────────────────────────────────────────────────
function Constellation({ active }) {
  const stars = [
    { x: 12, y: 18 }, { x: 28, y: 10 }, { x: 48, y: 16 },
    { x: 66, y: 8  }, { x: 84, y: 20 }, { x: 74, y: 36 },
    { x: 54, y: 42 }, { x: 36, y: 34 }, { x: 20, y: 40 },
  ];
  const lines = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,0],[2,7],[3,6]];
  return (
    <motion.svg
      className="absolute inset-0 pointer-events-none"
      viewBox="0 0 100 55"
      preserveAspectRatio="none"
      style={{ width: "100%", height: "60%", top: 0 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 0.5 }}
    >
      {lines.map(([a, b], i) => (
        <motion.line key={i}
          x1={stars[a].x} y1={stars[a].y} x2={stars[b].x} y2={stars[b].y}
          stroke="rgba(242,196,232,0.15)" strokeWidth="0.25"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: active ? 1 : 0 }}
          transition={{ duration: 0.9, delay: i * 0.045, ease: "easeOut" }}
        />
      ))}
      {stars.map((s, i) => (
        <motion.circle key={i} cx={s.x} cy={s.y} r="0.7"
          fill="rgb(242,196,232)"
          initial={{ opacity: 0 }}
          animate={{ opacity: active ? 0.5 : 0 }}
          transition={{ duration: 0.4, delay: 0.08 + i * 0.04 }}
        />
      ))}
    </motion.svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress ring
// ─────────────────────────────────────────────────────────────────────────────
function NooriProgressRing({ value, size = 56 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(221,160,221,0.09)" strokeWidth={3} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="url(#nRing)" strokeWidth={3}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1.3s ease" }} />
      <defs>
        <linearGradient id="nRing" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"  stopColor="#7c2d9e" />
          <stop offset="100%" stopColor="#e8c07a" />
        </linearGradient>
      </defs>
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        transform={`rotate(90,${size/2},${size/2})`}
        fill="rgb(242,196,232)" fontSize={10}
        style={{ fontFamily: "'Times New Roman', serif", fontStyle: "italic" }}>
        {value}%
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Drawer label / section helpers
// ─────────────────────────────────────────────────────────────────────────────
function DSection({ children }) {
  return (
    <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(221,160,221,0.07)" }}>
      {children}
    </div>
  );
}
function DLabel({ children }) {
  return (
    <p style={{
      fontFamily: "'Times New Roman', Times, serif",
      fontStyle: "italic",
      fontSize: "0.68rem",
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: "rgba(221,160,221,0.55)",
      marginBottom: "0.75rem",
    }}>
      {children}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOORI DRAWER
// ─────────────────────────────────────────────────────────────────────────────
export function NooriDrawer({ projectId, onClose, onEdit, onDelete, onMilestoneToggle }) {
  const [project,  setProject]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    api.get(`/projects/${projectId}`)
      .then((r) => setProject(r.data.data))
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleMilestone = async (mid) => {
    setToggling(mid);
    try {
      await onMilestoneToggle(projectId, mid);
      const r = await api.get(`/projects/${projectId}`);
      setProject(r.data.data);
    } finally { setToggling(null); }
  };

  const handleDelete = async () => {
    if (!confirm("Remove Noori? This cannot be undone.")) return;
    onClose(); await onDelete(projectId);
  };
  const handleEdit = () => { onClose(); setTimeout(() => onEdit(project), 100); };

  const status     = project ? statusMeta(project.status) : null;
  const done       = project?.milestones?.filter((m) => m.done).length || 0;
  const total      = project?.milestones?.length || 0;
  const taskCounts = {};
  (project?.taskStats || []).forEach(({ _id, count }) => { taskCounts[_id] = count; });
  const totalTasks = Object.values(taskCounts).reduce((a, b) => a + b, 0);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-40"
        style={{ background: "radial-gradient(ellipse at 65% 30%, rgba(124,45,158,0.13) 0%, rgba(0,0,0,0.65) 100%)" }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        className="fixed right-0 top-0 h-full z-50 w-full max-w-lg flex flex-col overflow-hidden"
        style={{
          background: "linear-gradient(175deg, #0d0810 0%, #180d1c 45%, #0f0812 100%)",
          borderLeft: "1px solid rgba(221,160,221,0.10)",
          boxShadow: "-8px 0 60px rgba(124,45,158,0.14), -1px 0 0 rgba(221,160,221,0.04)",
        }}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
      >
        {/* Ambient glow orbs — purely decorative */}
        <div className="absolute -top-24 right-0 w-72 h-72 pointer-events-none rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124,45,158,0.15) 0%, transparent 65%)", filter: "blur(50px)" }} />
        <div className="absolute bottom-0 -left-12 w-56 h-56 pointer-events-none rounded-full"
          style={{ background: "radial-gradient(circle, rgba(232,192,122,0.06) 0%, transparent 65%)", filter: "blur(40px)" }} />

        {/* Floating micro-dots — decorative only */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <motion.div key={i}
              className="absolute rounded-full"
              style={{
                width: 1.2, height: 1.2,
                background: "rgb(242,196,232)",
                left: `${10 + i * 8.5}%`,
                top: `${6 + (i % 4) * 20}%`,
              }}
              animate={{ opacity: [0.04, 0.20, 0.04] }}
              transition={{ duration: 3.5 + i * 0.4, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }}
            />
          ))}
        </div>

        {/* ── Header ── */}
        <div className="relative flex items-start gap-4 px-6 py-6"
          style={{ borderBottom: "1px solid rgba(221,160,221,0.08)" }}>
          <motion.div
            animate={{ y: [0, -5, 0], rotate: [0, 7, 0, -7, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-[1.6rem] shrink-0 mt-0.5 select-none">
            🌙
          </motion.div>

          <div className="flex-1 min-w-0">
            <h2 style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: "1.75rem",
              fontWeight: 700,
              background: "linear-gradient(125deg, rgb(232,192,122) 0%, rgb(242,196,232) 45%, rgb(221,160,221) 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              lineHeight: 1.2,
            }}>
              {loading ? "…" : project?.title}
            </h2>

            {status && (
              <div className="mt-1.5">
                <Badge className={clsx(status.color, "opacity-70")}>{status.label}</Badge>
              </div>
            )}

            <p style={{
              fontFamily: "'Times New Roman', Times, serif",
              fontStyle: "italic",
              fontSize: "0.68rem",
              color: "rgba(221,160,221,0.55)",
              marginTop: "0.5rem",
              letterSpacing: "0.14em",
            }}>
              ✦ a universe, just for her ✦
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {project && (
              <>
                <button onClick={handleEdit}
                  className="p-2 rounded-lg transition-all"
                  style={{ color: "rgba(221,160,221,0.50)" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = N.petal}
                  onMouseLeave={(e) => e.currentTarget.style.color = "rgba(221,160,221,0.50)"}>
                  <Edit2 size={14} />
                </button>
                <button onClick={handleDelete}
                  className="p-2 rounded-lg text-slate-600 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </>
            )}
            <button onClick={onClose}
              className="p-2 rounded-lg transition-all"
              style={{ color: "rgba(221,160,221,0.35)" }}
              onMouseEnter={(e) => e.currentTarget.style.color = N.rose}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(221,160,221,0.35)"}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center gap-3">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
              <Loader2 size={18} style={{ color: N.petal }} />
            </motion.div>
            <span style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: "1.1rem",
              color: "rgba(221,160,221,0.60)",
            }}>
              opening the universe…
            </span>
          </div>
        ) : !project ? (
          <div className="flex-1 flex items-center justify-center"
            style={{ fontFamily: "'Times New Roman', serif", fontStyle: "italic", color: "rgba(221,160,221,0.55)", fontSize: "0.88rem" }}>
            the universe could not be found.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">

            {/* ── Description — PLAIN DIV, zero animation, renders immediately ── */}
            {project.description && (
              <div
                className="relative px-6 py-6"
                style={{ borderBottom: "1px solid rgba(221,160,221,0.07)" }}
              >
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(135deg, rgba(124,45,158,0.04) 0%, transparent 55%)" }} />
                {/* Decorative quote mark */}
                <div className="absolute top-2 left-3 text-6xl leading-none pointer-events-none select-none"
                  style={{ color: "rgba(221,160,221,0.05)", fontFamily: "'Times New Roman', serif" }}>"</div>
                <p className="relative"
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: "1.18rem",
                    color: "rgb(242,196,232)",
                    lineHeight: 1.85,
                    letterSpacing: "0.01em",
                  }}>
                  {project.description}
                </p>
              </div>
            )}

            {/* ── Stats row ── */}
            <div className="grid grid-cols-3 gap-3 px-6 py-5">
              {[
                {
                  label: "progress",
                  value: <NooriProgressRing value={project.progress} />,
                },
                {
                  label: "milestones",
                  value: (
                    <div className="flex items-baseline gap-0.5">
                      <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: "1.6rem", fontWeight: 700, color: "rgb(242,196,232)" }}>{done}</span>
                      <span style={{ fontFamily: "'Times New Roman', serif", fontStyle: "italic", fontSize: "0.8rem", color: "rgba(221,160,221,0.65)" }}>/{total}</span>
                    </div>
                  ),
                  icon: <Target size={10} />,
                },
                {
                  label: "tasks",
                  value: <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: "1.6rem", fontWeight: 700, color: "rgb(242,196,232)" }}>{totalTasks}</span>,
                  icon: <BarChart3 size={10} />,
                },
              ].map((s, i) => (
                <div key={i}
                  className="rounded-2xl p-4 flex flex-col items-center justify-center gap-1 text-center"
                  style={{ background: "rgba(221,160,221,0.04)", border: "1px solid rgba(221,160,221,0.09)" }}>
                  <div className="flex items-center gap-1 justify-center">{s.value}</div>
                  <p className="flex items-center gap-0.5 mt-1"
                    style={{
                      fontFamily: "'Times New Roman', serif",
                      fontStyle: "italic",
                      fontSize: "0.62rem",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "rgba(221,160,221,0.60)",
                    }}>
                    {s.icon}{s.label}
                  </p>
                </div>
              ))}
            </div>

            {/* ── Categories ── */}
            {project.categories?.length > 0 && (
              <DSection>
                <DLabel>Categories</DLabel>
                <div className="flex gap-2 flex-wrap">
                  {project.categories.map((cat) => {
                    const meta = PROJECT_CATEGORIES.find((c) => c.value === cat);
                    return meta ? (
                      <span key={cat} className={clsx("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium opacity-75", meta.color)}>
                        {meta.icon} {meta.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </DSection>
            )}

            {/* ── Links ── */}
            {(project.repoLink || project.liveUrl) && (
              <DSection>
                <div className="space-y-3">
                  {project.repoLink && (
                    <div>
                      <DLabel>Repository</DLabel>
                      <a href={project.repoLink} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 break-all transition-colors"
                        style={{ fontFamily: "'Caveat', cursive", fontSize: "1rem", color: "rgba(221,160,221,0.70)" }}
                        onMouseEnter={(e) => e.currentTarget.style.color = N.petal}
                        onMouseLeave={(e) => e.currentTarget.style.color = "rgba(221,160,221,0.70)"}>
                        <GitBranch size={12} />{project.repoLink}<ExternalLink size={10} className="shrink-0" />
                      </a>
                    </div>
                  )}
                  {project.liveUrl && (
                    <div>
                      <DLabel>Live Site</DLabel>
                      <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 break-all transition-colors"
                        style={{ fontFamily: "'Caveat', cursive", fontSize: "1rem", color: "rgba(232,192,122,0.70)" }}
                        onMouseEnter={(e) => e.currentTarget.style.color = N.gold}
                        onMouseLeave={(e) => e.currentTarget.style.color = "rgba(232,192,122,0.70)"}>
                        <Globe size={12} />{project.liveUrl}<ExternalLink size={10} className="shrink-0" />
                      </a>
                    </div>
                  )}
                </div>
              </DSection>
            )}

            {/* ── Milestones ── */}
            {total > 0 && (
              <DSection>
                <div className="flex items-center justify-between mb-4">
                  <DLabel>Milestones</DLabel>
                  <span style={{
                    fontFamily: "'Times New Roman', serif",
                    fontStyle: "italic",
                    fontSize: "0.7rem",
                    color: "rgba(221,160,221,0.55)",
                  }}>
                    {done}/{total} complete
                  </span>
                </div>
                {/* Warm progress bar */}
                <div className="h-px w-full mb-4 rounded-full overflow-hidden"
                  style={{ background: "rgba(221,160,221,0.09)" }}>
                  <motion.div className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #7c2d9e, rgb(221,160,221), rgb(232,192,122))" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${project.progress}%` }}
                    transition={{ duration: 1.6, ease: "easeOut", delay: 0.4 }} />
                </div>
                <div className="space-y-2">
                  {project.milestones.map((m, idx) => (
                    <button key={m._id}
                      onClick={() => handleMilestone(m._id)}
                      disabled={toggling === m._id}
                      className={clsx(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all",
                        toggling === m._id && "opacity-40 pointer-events-none"
                      )}
                      style={{
                        background: m.done ? "rgba(221,160,221,0.05)" : "rgba(255,255,255,0.02)",
                        border: m.done ? "1px solid rgba(221,160,221,0.15)" : "1px solid rgba(255,255,255,0.04)",
                      }}>
                      {m.done
                        ? <CheckCircle size={15} style={{ color: N.petal }} className="shrink-0" />
                        : <Circle      size={15} style={{ color: "rgba(221,160,221,0.25)" }} className="shrink-0" />}
                      <span className={clsx("flex-1 text-left", m.done ? "line-through" : "")}
                        style={{
                          fontFamily: "'Caveat', cursive",
                          fontSize: "0.98rem",
                          // Done items: muted; not done: fully readable
                          color: m.done ? "rgba(221,160,221,0.40)" : "rgb(242,196,232)",
                        }}>
                        {m.title}
                      </span>
                      {m.dueDate && (
                        <span className="flex items-center gap-1 shrink-0"
                          style={{ fontFamily: "'Times New Roman', serif", fontStyle: "italic", fontSize: "0.65rem", color: "rgba(221,160,221,0.50)" }}>
                          <Calendar size={9} />{new Date(m.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </DSection>
            )}

            {/* ── Task breakdown ── */}
            {totalTasks > 0 && (
              <DSection>
                <DLabel>Tasks by status</DLabel>
                <div className="space-y-1.5">
                  {Object.entries(taskCounts).map(([st, count]) => (
                    <div key={st} className="flex items-center justify-between rounded-xl px-3 py-2.5"
                      style={{ background: "rgba(221,160,221,0.04)", border: "1px solid rgba(221,160,221,0.08)" }}>
                      <span className="capitalize"
                        style={{ fontFamily: "'Caveat', cursive", fontSize: "0.95rem", color: "rgb(221,160,221)" }}>
                        {st.replace(/-/g, " ")}
                      </span>
                      <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: "1.1rem", fontWeight: 600, color: "rgb(232,192,122)" }}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </DSection>
            )}

            {/* ── Notes ── */}
            {project.notes && (
              <DSection>
                <DLabel>Notes</DLabel>
                <div className="rounded-2xl px-5 py-4"
                  style={{ background: "rgba(221,160,221,0.03)", border: "1px solid rgba(221,160,221,0.08)" }}>
                  <p className="leading-relaxed whitespace-pre-wrap"
                    style={{ fontFamily: "'Caveat', cursive", fontSize: "1.08rem", color: "rgb(242,196,232)" }}>
                    {project.notes}
                  </p>
                </div>
              </DSection>
            )}

            {/* ── Timestamps ── */}
            <div className="px-6 py-4 space-y-0.5"
              style={{ borderTop: "1px solid rgba(221,160,221,0.05)" }}>
              {[
                `Created ${new Date(project.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`,
                `Last updated ${new Date(project.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`,
              ].map((t, i) => (
                <span key={i} className="block"
                  style={{ fontFamily: "'Times New Roman', serif", fontStyle: "italic", fontSize: "0.68rem", color: "rgba(221,160,221,0.45)" }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        {project && (
          <div className="px-6 py-4 shrink-0" style={{ borderTop: "1px solid rgba(221,160,221,0.08)" }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ boxShadow: "0 0 28px rgba(221,160,221,0.14)" }}
              onClick={handleEdit}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl transition-all"
              style={{
                background: "linear-gradient(135deg, rgba(124,45,158,0.16), rgba(221,160,221,0.07))",
                border: "1px solid rgba(221,160,221,0.20)",
                color: "rgb(221,160,221)",
                fontFamily: "'Dancing Script', cursive",
                fontSize: "1.1rem",
              }}>
              <Edit2 size={13} /> Edit Project
            </motion.button>
          </div>
        )}
      </motion.div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOORI CARD — the breathing tile
// ─────────────────────────────────────────────────────────────────────────────
export default function NooriCard({ project, onView, onEdit, onDelete, onMilestoneToggle }) {
  const status = statusMeta(project.status);
  const done   = project.milestones?.filter((m) => m.done).length || 0;

  const [active,     setActive]     = useState(false);
  const [whisper,    setWhisper]    = useState("");
  const [floaters,   setFloaters]   = useState([]);
  const [soundReady, setSoundReady] = useState(false);
  const [tapCount,   setTapCount]   = useState(0);

  const cardRef  = useRef(null);
  const glowRef  = useRef(null);
  const touchRef = useRef(null);

  // Spring-tracked cursor glow
  const rawX  = useMotionValue(0.5);
  const rawY  = useMotionValue(0.5);
  const glowX = useSpring(rawX, { stiffness: 80, damping: 20 });
  const glowY = useSpring(rawY, { stiffness: 80, damping: 20 });

  const writeGlow = useCallback(() => {
    if (!glowRef.current) return;
    const x = glowX.get() * 100;
    const y = glowY.get() * 100;
    glowRef.current.style.background =
      `radial-gradient(ellipse 68% 52% at ${x}% ${y}%, rgba(124,45,158,0.22) 0%, rgba(232,192,122,0.06) 50%, transparent 70%)`;
  }, [glowX, glowY]);

  useEffect(() => {
    const ux = glowX.on("change", writeGlow);
    const uy = glowY.on("change", writeGlow);
    return () => { ux(); uy(); };
  }, []);

  const spawnFloaters = () => {
    setFloaters(
      Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        x: 5 + Math.random() * 90,
        delay: i * 0.09,
        drift: (Math.random() - 0.5) * 24,
        symbol: FLOATERS[Math.floor(Math.random() * FLOATERS.length)],
      }))
    );
  };

  const activate = useCallback((clientX, clientY) => {
    setSoundReady(true);
    setActive(true);
    setWhisper((prev) => {
      const pool = WHISPERS.filter((w) => w !== prev);
      return pool[Math.floor(Math.random() * pool.length)];
    });
    spawnFloaters();
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect && clientX !== undefined) {
      rawX.set((clientX - rect.left) / rect.width);
      rawY.set((clientY - rect.top)  / rect.height);
    }
    if (soundReady) playSingingBowl();
  }, [soundReady]);

  const deactivate = useCallback(() => {
    setActive(false);
    rawX.set(0.5); rawY.set(0.5);
  }, []);

  const onMouseEnter = (e) => activate(e.clientX, e.clientY);
  const onMouseLeave = () => deactivate();
  const onMouseMove  = useCallback((e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left) / rect.width);
    rawY.set((e.clientY - rect.top)  / rect.height);
  }, []);

  const onTouchStart = (e) => {
    const t = e.touches[0];
    activate(t.clientX, t.clientY);
    setTapCount((c) => c + 1);
    clearTimeout(touchRef.current);
    touchRef.current = setTimeout(() => setTapCount(0), 700);
  };
  const onTouchEnd = (e) => {
    e.preventDefault();
    if (tapCount >= 1) { deactivate(); onView(project); }
    else setTimeout(() => deactivate(), 2200);
  };
  useEffect(() => () => clearTimeout(touchRef.current), []);

  return (
    <motion.div
      ref={cardRef}
      // ── BREATHING animation — scale AND subtle box-shadow pulse ──
      animate={active ? { scale: 1.016 } : {
        scale: [1, 1.008, 1.003, 1.009, 1],
        boxShadow: [
          "0 0 0 1px rgba(221,160,221,0.03), 0 4px 24px rgba(0,0,0,0.50)",
          "0 0 0 1px rgba(221,160,221,0.07), 0 6px 32px rgba(124,45,158,0.12)",
          "0 0 0 1px rgba(221,160,221,0.04), 0 4px 28px rgba(0,0,0,0.48)",
          "0 0 0 1px rgba(221,160,221,0.08), 0 8px 36px rgba(124,45,158,0.14)",
          "0 0 0 1px rgba(221,160,221,0.03), 0 4px 24px rgba(0,0,0,0.50)",
        ],
      }}
      transition={active
        ? { duration: 0.22, ease: "easeOut" }
        : { duration: 7, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }
      }
      className="relative overflow-hidden cursor-pointer rounded-2xl flex flex-col gap-3.5 p-5 group select-none"
      style={{
        background: "linear-gradient(155deg, #180d1c 0%, #160a1a 55%, #0d0810 100%)",
        border: active ? "1px solid rgba(221,160,221,0.28)" : "1px solid rgba(221,160,221,0.10)",
        willChange: "transform",
        transition: "border-color 0.5s ease",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={() => { if (window.matchMedia("(hover: hover)").matches) onView(project); }}
    >
      {/* Cursor glow */}
      <div ref={glowRef}
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{ opacity: active ? 1 : 0, transition: "opacity 0.6s ease" }}
      />

      {/* Grain */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl opacity-[0.018]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "140px",
        }}
      />

      {/* Top shimmer */}
      <div className="absolute top-0 left-5 right-5 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(221,160,221,0.15), rgba(232,192,122,0.09), transparent)" }}
      />

      {/* Constellation on hover */}
      <Constellation active={active} />

      {/* Floating particles */}
      <AnimatePresence>
        {active && floaters.map((f) => (
          <Floater key={f.id} x={f.x} delay={f.delay} drift={f.drift} symbol={f.symbol} />
        ))}
      </AnimatePresence>

      {/* Hover overlay — NO transform on content, pure opacity */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="absolute inset-0 z-20 rounded-2xl flex flex-col items-center justify-center gap-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.38 }}
            style={{
              background: "radial-gradient(ellipse at center, rgba(13,8,16,0.92) 0%, rgba(13,8,16,0.75) 100%)",
              backdropFilter: "blur(5px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.04, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ fontSize: "2rem", lineHeight: 1 }}
            >
              🌙
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.p
                key={whisper}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.42, ease: "easeOut" }}
                className="text-center px-8"
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: "1.08rem",
                  fontStyle: "italic",
                  color: "rgba(242,196,232,0.82)",
                  lineHeight: 1.5,
                  letterSpacing: "0.015em",
                }}
              >
                {whisper}
              </motion.p>
            </AnimatePresence>

            <p style={{
              fontFamily: "'Times New Roman', Times, serif",
              fontStyle: "italic",
              fontSize: "0.65rem",
              color: "rgba(221,160,221,0.30)",
              letterSpacing: "0.16em",
            }}>
              ✦ only one person belongs here ✦
            </p>

            <p className="text-[10px] md:hidden"
              style={{ color: "rgba(221,160,221,0.28)", fontFamily: "'Caveat', cursive" }}>
              tap again to open
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit / Delete (desktop hover) */}
      <div
        className="absolute top-3.5 right-3.5 z-30 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={(e) => { e.stopPropagation(); onEdit(project); }}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "rgba(221,160,221,0.40)" }}
          onMouseEnter={(e) => e.currentTarget.style.color = N.petal}
          onMouseLeave={(e) => e.currentTarget.style.color = "rgba(221,160,221,0.40)"}>
          <Edit2 size={12} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(project._id); }}
          className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 transition-colors">
          <Trash2 size={12} />
        </button>
      </div>

      {/* ── Card content ── */}
      <div className="relative z-10 flex flex-col gap-3.5">

        {/* Title */}
        <div className="flex items-center gap-2.5 min-w-0 pr-12">
          <motion.span
            animate={{ y: [0, -4, 0], rotate: [0, 6, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-[15px] shrink-0 select-none">
            🌙
          </motion.span>
          <p style={{
            fontFamily: "'Dancing Script', cursive",
            fontSize: "1.3rem",
            fontWeight: 700,
            background: "linear-gradient(128deg, rgb(232,192,122) 0%, rgb(242,196,232) 55%, rgb(221,160,221) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
            letterSpacing: "0.01em",
            lineHeight: 1.25,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "block",
          }}>
            {project.title}
          </p>
        </div>

        {/* Description — static, no animation */}
        {project.description && (
          <p className="line-clamp-2" style={{
            fontFamily: "'Caveat', cursive",
            fontSize: "0.9rem",
            fontStyle: "italic",
            color: "rgba(242,196,232,0.72)",
            lineHeight: 1.55,
          }}>
            {project.description}
          </p>
        )}

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {status && <Badge className={clsx(status.color, "opacity-65 text-[10px]")}>{status.label}</Badge>}
          {project.categories?.map((cat) => {
            const meta = PROJECT_CATEGORIES.find((c) => c.value === cat);
            return meta ? (
              <span key={cat} className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium opacity-60", meta.color)}>
                {meta.icon} {meta.label}
              </span>
            ) : null;
          })}
          {project.repoLink && (
            <a href={project.repoLink} target="_blank" rel="noopener noreferrer"
              className="text-[10px] flex items-center gap-1 z-30 transition-colors"
              style={{ color: "rgba(221,160,221,0.50)", fontFamily: "'Caveat', cursive" }}
              onClick={(e) => e.stopPropagation()}>
              <GitBranch size={10} />Repo
            </a>
          )}
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
              className="text-[10px] flex items-center gap-1 z-30 transition-colors"
              style={{ color: "rgba(232,192,122,0.55)", fontFamily: "'Caveat', cursive" }}
              onClick={(e) => e.stopPropagation()}>
              <Globe size={10} />Live
            </a>
          )}
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between mb-1.5" style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontStyle: "italic",
            fontSize: "0.62rem",
            letterSpacing: "0.08em",
            color: "rgba(221,160,221,0.40)",
          }}>
            <span>progress</span><span>{project.progress}%</span>
          </div>
          <div className="h-[1.5px] rounded-full overflow-hidden"
            style={{ background: "rgba(221,160,221,0.08)" }}>
            <motion.div className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #7c2d9e, rgb(221,160,221), rgb(232,192,122))" }}
              initial={{ width: 0 }}
              animate={{ width: `${project.progress}%` }}
              transition={{ duration: 1.4, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Milestones preview */}
        {project.milestones?.length > 0 && (
          <div className="space-y-1.5">
            {project.milestones.slice(0, 3).map((m) => (
              <div key={m._id}
                onClick={(e) => { e.stopPropagation(); onMilestoneToggle(project._id, m._id); }}
                className="flex items-center gap-2 cursor-pointer z-30">
                {m.done
                  ? <CheckCircle size={11} style={{ color: N.petal }} className="shrink-0" />
                  : <Circle      size={11} style={{ color: "rgba(221,160,221,0.22)" }} className="shrink-0" />}
                <span className={m.done ? "line-through" : ""}
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: "0.83rem",
                    color: m.done ? "rgba(221,160,221,0.38)" : "rgba(242,196,232,0.80)",
                  }}>
                  {m.title}
                </span>
              </div>
            ))}
            {project.milestones.length > 3 && (
              <p className="flex items-center gap-0.5" style={{
                fontSize: "0.65rem",
                fontFamily: "'Times New Roman', serif",
                fontStyle: "italic",
                color: "rgba(221,160,221,0.35)",
              }}>
                +{project.milestones.length - 3} more <ChevronRight size={9} />
              </p>
            )}
          </div>
        )}
      </div>

      {/* Desktop view hint */}
      <div className="absolute bottom-3.5 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="flex items-center gap-0.5" style={{
          fontSize: "0.62rem",
          fontFamily: "'Times New Roman', serif",
          fontStyle: "italic",
          color: "rgba(221,160,221,0.28)",
        }}>
          Open <ChevronRight size={8} />
        </span>
      </div>

      {/* Bottom shimmer */}
      <div className="absolute bottom-0 left-5 right-5 h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(221,160,221,0.09), rgba(232,192,122,0.05), transparent)",
          opacity: active ? 1 : 0.35,
          transition: "opacity 0.6s ease",
        }}
      />
    </motion.div>
  );
}