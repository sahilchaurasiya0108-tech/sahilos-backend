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
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const WHISPERS = [
  "A quiet little universe...",
  "It listens. It remembers. It stays.",
  "Some things are not meant to be opened.",
  "She needed a place. So one was made.",
  "Not built to be used. Built to be felt.",
  "Some days it's just… there.",
  "Her thoughts rest here.",
  "A universe of one.",
];

// Noori palette — warm rose/cream/gold, distinct from sahilos cold slate/indigo
const N = {
  void:    "#110a12",
  deep:    "#1c0f1e",
  bloom:   "#9d4edd",
  petal:   "#e9a8f0",
  rose:    "#f5c6e8",
  gold:    "#f0c27f",
  amber:   "#e8b86d",
  border:  "rgba(233,168,240,0.13)",
  borderA: "rgba(233,168,240,0.30)",
};

// Symbols that float upward on hover/touch
const SYMBOLS = ["✦", "✧", "⋆", "✦", "✧", "⋆", "·", "✦"];

const statusMeta = (v) => PROJECT_STATUSES.find((s) => s.value === v);

// ─────────────────────────────────────────────────────────────────────────────
// Wind-chime sound — Web Audio, no external file
// ─────────────────────────────────────────────────────────────────────────────
function playChime() {
  try {
    const ctx   = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.5, 880, 698.46];
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.18 + Math.random() * 0.08;
      const dur   = 1.6 + Math.random() * 0.8;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.045, start + 0.07);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.start(start);
      osc.stop(start + dur);
    });
  } catch (_) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// FloatSymbol — ✦ ✧ ⋆ drifting upward on hover/touch
// ─────────────────────────────────────────────────────────────────────────────
function FloatSymbol({ x, delay, symbol }) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none text-[11px]"
      style={{ left: `${x}%`, bottom: 0, color: N.petal }}
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: [0, 0.6, 0], y: -60 }}
      transition={{ duration: 2.5, delay, ease: "easeOut" }}
    >
      {symbol}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress Ring — warm rose gradient
// ─────────────────────────────────────────────────────────────────────────────
function NooriProgressRing({ value, size = 56 }) {
  const r    = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(233,168,240,0.10)" strokeWidth={3.5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="url(#nooriRingGrad)" strokeWidth={3.5}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1.2s ease" }} />
      <defs>
        <linearGradient id="nooriRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={N.bloom} />
          <stop offset="100%" stopColor={N.rose}  />
        </linearGradient>
      </defs>
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        transform={`rotate(90,${size/2},${size/2})`}
        fill={N.rose} fontSize={11} fontWeight={600}>{value}%</text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Drawer helpers
// ─────────────────────────────────────────────────────────────────────────────
function DSection({ children }) {
  return (
    <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(233,168,240,0.06)" }}>
      {children}
    </div>
  );
}
function DLabel({ children }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest mb-3"
      style={{ color: "rgba(233,168,240,0.32)", fontFamily: "'Caveat', cursive" }}>
      {children}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── Noori Drawer
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
    if (!confirm("Delete Noori? This cannot be undone.")) return;
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
        style={{ background: "radial-gradient(ellipse at 60% 40%, rgba(157,78,221,0.10) 0%, rgba(0,0,0,0.62) 100%)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        className="fixed right-0 top-0 h-full z-50 w-full max-w-lg flex flex-col overflow-hidden"
        style={{
          background: `linear-gradient(170deg, ${N.void} 0%, #130d15 55%, #0e0910 100%)`,
          borderLeft: `1px solid ${N.border}`,
          boxShadow: "-6px 0 50px rgba(157,78,221,0.10), -1px 0 0 rgba(233,168,240,0.04)",
        }}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
      >
        {/* Ambient floating symbols */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {SYMBOLS.slice(0, 6).map((s, i) => (
            <motion.span key={i} className="absolute select-none text-[9px]"
              style={{ left: `${12 + i * 14}%`, top: `${8 + (i % 3) * 22}%`, color: N.petal }}
              animate={{ y: [0, -10, 0], opacity: [0.07, 0.25, 0.07] }}
              transition={{ duration: 3.5 + i * 0.7, repeat: Infinity, delay: i * 0.9, ease: "easeInOut" }}>
              {s}
            </motion.span>
          ))}
        </div>

        {/* Top glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(157,78,221,0.13) 0%, transparent 70%)", filter: "blur(48px)" }} />

        {/* Bottom warm glow */}
        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(240,194,127,0.05) 0%, transparent 70%)", filter: "blur(36px)" }} />

        {/* Header */}
        <div className="relative flex items-start gap-4 px-6 py-6"
          style={{ borderBottom: "1px solid rgba(233,168,240,0.09)" }}>

          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="text-2xl shrink-0 mt-0.5">
            🌙
          </motion.div>

          <div className="flex-1 min-w-0">
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-2xl font-semibold leading-snug"
              style={{
                fontFamily: "'Caveat', cursive",
                background: `linear-gradient(135deg, ${N.rose}, ${N.petal}, ${N.gold})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "0.02em",
              }}>
              {loading ? "…" : project?.title}
            </motion.h2>

            {status && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-1.5">
                <Badge className={clsx(status.color, "opacity-70")}>{status.label}</Badge>
              </motion.div>
            )}

            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="text-[10px] mt-2 tracking-widest"
              style={{ color: `${N.petal}45`, fontFamily: "'Caveat', cursive" }}>
              ✦ a universe, just for her ✦
            </motion.p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {project && (
              <>
                <button onClick={handleEdit}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: `${N.petal}50` }}
                  onMouseEnter={(e) => e.currentTarget.style.color = N.petal}
                  onMouseLeave={(e) => e.currentTarget.style.color = `${N.petal}50`}>
                  <Edit2 size={15} />
                </button>
                <button onClick={handleDelete}
                  className="p-2 rounded-lg transition-colors text-slate-500 hover:text-red-400">
                  <Trash2 size={15} />
                </button>
              </>
            )}
            <button onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{ color: `${N.petal}35` }}
              onMouseEnter={(e) => e.currentTarget.style.color = N.rose}
              onMouseLeave={(e) => e.currentTarget.style.color = `${N.petal}35`}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center gap-3">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}>
              <Loader2 size={20} style={{ color: N.petal }} />
            </motion.div>
            <span className="text-base italic" style={{ color: `${N.petal}35`, fontFamily: "'Caveat', cursive" }}>
              opening the universe…
            </span>
          </div>
        ) : !project ? (
          <div className="flex-1 flex items-center justify-center text-sm italic"
            style={{ color: `${N.petal}28`, fontFamily: "'Caveat', cursive" }}>
            the universe could not be found.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">

            {/* Description — calm fade-in, no rolling */}
            {project.description && (
              <motion.div
                className="relative px-6 py-7 overflow-hidden"
                style={{ borderBottom: "1px solid rgba(233,168,240,0.06)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.18 }}>
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(135deg, rgba(157,78,221,0.04) 0%, transparent 60%)" }} />
                {/* Big quote mark */}
                <div className="absolute top-3 left-4 text-7xl leading-none pointer-events-none select-none"
                  style={{ color: "rgba(233,168,240,0.05)", fontFamily: "Georgia, serif" }}>
                  "
                </div>
                <p className="relative leading-[1.85] italic"
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: "1.15rem",
                    color: `${N.rose}72`,
                  }}>
                  {project.description}
                </p>
              </motion.div>
            )}

            {/* Stats */}
            <motion.div
              className="grid grid-cols-3 gap-3 px-6 py-5"
              initial="hidden" animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
              {[
                {
                  label: "progress",
                  value: <NooriProgressRing value={project.progress} />,
                },
                {
                  label: "milestones",
                  value: <><span className="text-2xl font-semibold" style={{ color: N.rose }}>{done}</span><span className="text-sm" style={{ color: `${N.petal}38` }}>/{total}</span></>,
                  icon: <Target size={11} />,
                },
                {
                  label: "linked tasks",
                  value: <span className="text-2xl font-semibold" style={{ color: N.rose }}>{totalTasks}</span>,
                  icon: <BarChart3 size={11} />,
                },
              ].map((s, i) => (
                <motion.div key={i}
                  variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                  className="rounded-2xl p-4 flex flex-col items-center justify-center gap-1 text-center"
                  style={{ background: "rgba(233,168,240,0.04)", border: "1px solid rgba(233,168,240,0.09)" }}>
                  <div className="flex items-center gap-1 justify-center">{s.value}</div>
                  <p className="text-[10px] flex items-center gap-0.5 mt-0.5" style={{ color: `${N.petal}32` }}>
                    {s.icon}{s.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* Categories */}
            {project.categories?.length > 0 && (
              <DSection>
                <DLabel>Categories</DLabel>
                <div className="flex gap-2 flex-wrap">
                  {project.categories.map((cat) => {
                    const meta = PROJECT_CATEGORIES.find((c) => c.value === cat);
                    return meta ? (
                      <span key={cat} className={clsx("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium opacity-70", meta.color)}>
                        {meta.icon} {meta.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </DSection>
            )}

            {/* Links */}
            {(project.repoLink || project.liveUrl) && (
              <DSection>
                <div className="space-y-2">
                  {project.repoLink && (
                    <div>
                      <DLabel>Repository</DLabel>
                      <a href={project.repoLink} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm break-all transition-colors"
                        style={{ color: `${N.petal}60` }}
                        onMouseEnter={(e) => e.currentTarget.style.color = N.petal}
                        onMouseLeave={(e) => e.currentTarget.style.color = `${N.petal}60`}>
                        <GitBranch size={13} />{project.repoLink}<ExternalLink size={11} className="shrink-0" />
                      </a>
                    </div>
                  )}
                  {project.liveUrl && (
                    <div>
                      <DLabel>Live Site</DLabel>
                      <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm break-all transition-colors"
                        style={{ color: `${N.rose}60` }}
                        onMouseEnter={(e) => e.currentTarget.style.color = N.rose}
                        onMouseLeave={(e) => e.currentTarget.style.color = `${N.rose}60`}>
                        <Globe size={13} />{project.liveUrl}<ExternalLink size={11} className="shrink-0" />
                      </a>
                    </div>
                  )}
                </div>
              </DSection>
            )}

            {/* Milestones */}
            {total > 0 && (
              <DSection>
                <div className="flex items-center justify-between mb-4">
                  <DLabel>Milestones</DLabel>
                  <span className="text-xs" style={{ color: `${N.petal}32` }}>{done}/{total} complete</span>
                </div>
                {/* Warm progress bar */}
                <div className="h-px w-full mb-4 rounded-full overflow-hidden"
                  style={{ background: "rgba(233,168,240,0.09)" }}>
                  <motion.div className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${N.bloom}, ${N.petal}, ${N.rose})` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${project.progress}%` }}
                    transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }} />
                </div>
                <div className="space-y-2">
                  {project.milestones.map((m, idx) => (
                    <motion.button key={m._id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + idx * 0.06 }}
                      onClick={() => handleMilestone(m._id)}
                      disabled={toggling === m._id}
                      className={clsx(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all",
                        toggling === m._id && "opacity-40 pointer-events-none"
                      )}
                      style={{
                        background: m.done ? "rgba(233,168,240,0.05)" : "rgba(255,255,255,0.02)",
                        border: m.done ? "1px solid rgba(233,168,240,0.16)" : "1px solid rgba(255,255,255,0.04)",
                      }}>
                      {m.done
                        ? <CheckCircle size={16} style={{ color: N.petal }} className="shrink-0" />
                        : <Circle      size={16} style={{ color: "rgba(233,168,240,0.22)" }} className="shrink-0" />}
                      <span className={clsx("text-sm flex-1 text-left", m.done ? "line-through" : "")}
                        style={{ color: m.done ? `${N.petal}32` : `${N.rose}65` }}>
                        {m.title}
                      </span>
                      {m.dueDate && (
                        <span className="text-[10px] flex items-center gap-1 shrink-0"
                          style={{ color: `${N.petal}30` }}>
                          <Calendar size={10} />{new Date(m.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </motion.button>
                  ))}
                </div>
              </DSection>
            )}

            {/* Task breakdown */}
            {totalTasks > 0 && (
              <DSection>
                <DLabel>Tasks by status</DLabel>
                <div className="space-y-1.5">
                  {Object.entries(taskCounts).map(([st, count]) => (
                    <div key={st} className="flex items-center justify-between rounded-xl px-3 py-2"
                      style={{ background: "rgba(233,168,240,0.03)", border: "1px solid rgba(233,168,240,0.07)" }}>
                      <span className="text-sm capitalize" style={{ color: `${N.petal}48` }}>{st.replace(/-/g, " ")}</span>
                      <span className="text-sm font-medium" style={{ color: `${N.rose}65` }}>{count}</span>
                    </div>
                  ))}
                </div>
              </DSection>
            )}

            {/* Notes */}
            {project.notes && (
              <DSection>
                <DLabel>Notes</DLabel>
                <div className="rounded-2xl px-5 py-4"
                  style={{ background: "rgba(233,168,240,0.03)", border: "1px solid rgba(233,168,240,0.07)" }}>
                  <p className="leading-relaxed whitespace-pre-wrap italic"
                    style={{ fontFamily: "'Caveat', cursive", fontSize: "1.1rem", color: `${N.rose}52` }}>
                    {project.notes}
                  </p>
                </div>
              </DSection>
            )}

            {/* Timestamps */}
            <div className="px-6 py-4 text-[11px] space-y-0.5"
              style={{ borderTop: "1px solid rgba(233,168,240,0.05)", color: `${N.petal}22` }}>
              <span className="block">Created {new Date(project.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
              <span className="block">Last updated {new Date(project.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        {project && (
          <div className="px-6 py-4 shrink-0"
            style={{ borderTop: "1px solid rgba(233,168,240,0.08)" }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleEdit}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium transition-all"
              style={{
                background: "linear-gradient(135deg, rgba(157,78,221,0.16), rgba(233,168,240,0.07))",
                border: "1px solid rgba(233,168,240,0.20)",
                color: N.petal,
                fontFamily: "'Caveat', cursive",
                fontSize: "1rem",
              }}>
              <Edit2 size={14} /> Edit Project
            </motion.button>
          </div>
        )}
      </motion.div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── Noori Card
// ─────────────────────────────────────────────────────────────────────────────
export default function NooriCard({ project, onView, onEdit, onDelete, onMilestoneToggle }) {
  const status = statusMeta(project.status);
  const done   = project.milestones?.filter((m) => m.done).length || 0;

  const [active,     setActive]     = useState(false);
  const [whisper,    setWhisper]    = useState("");
  const [symbols,    setSymbols]    = useState([]);
  const [chimeReady, setChimeReady] = useState(false);
  const [tapCount,   setTapCount]   = useState(0);

  const cardRef  = useRef(null);
  const glowRef  = useRef(null);
  const touchRef = useRef(null);

  // Spring-tracked warm glow
  const rawX  = useMotionValue(0.5);
  const rawY  = useMotionValue(0.5);
  const glowX = useSpring(rawX, { stiffness: 90, damping: 18 });
  const glowY = useSpring(rawY, { stiffness: 90, damping: 18 });

  const writeGlow = useCallback(() => {
    if (!glowRef.current) return;
    const x = glowX.get() * 100;
    const y = glowY.get() * 100;
    glowRef.current.style.background =
      `radial-gradient(ellipse at ${x}% ${y}%, rgba(157,78,221,0.22) 0%, rgba(240,194,127,0.07) 46%, transparent 68%)`;
  }, [glowX, glowY]);

  useEffect(() => {
    const ux = glowX.on("change", writeGlow);
    const uy = glowY.on("change", writeGlow);
    return () => { ux(); uy(); };
  }, []);

  const activate = useCallback((clientX, clientY) => {
    setChimeReady(true);
    setActive(true);
    setWhisper((prev) => {
      const pool = WHISPERS.filter((w) => w !== prev);
      return pool[Math.floor(Math.random() * pool.length)];
    });
    setSymbols(
      Array.from({ length: 10 }, (_, i) => ({
        id: Date.now() + i,
        x: 8 + Math.random() * 84,
        delay: i * 0.09,
        symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      }))
    );
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect && clientX !== undefined) {
      rawX.set((clientX - rect.left) / rect.width);
      rawY.set((clientY - rect.top)  / rect.height);
    }
    if (chimeReady) playChime();
  }, [chimeReady]);

  const deactivate = useCallback(() => {
    setActive(false);
    rawX.set(0.5);
    rawY.set(0.5);
  }, []);

  // Mouse — desktop hover only
  const onMouseEnter = (e) => activate(e.clientX, e.clientY);
  const onMouseLeave = () => deactivate();
  const onMouseMove  = useCallback((e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left) / rect.width);
    rawY.set((e.clientY - rect.top)  / rect.height);
  }, []);

  // Touch — first tap shows overlay; second tap opens drawer
  const onTouchStart = (e) => {
    const t = e.touches[0];
    activate(t.clientX, t.clientY);
    setTapCount((c) => c + 1);
    clearTimeout(touchRef.current);
    touchRef.current = setTimeout(() => setTapCount(0), 600);
  };

  const onTouchEnd = (e) => {
    e.preventDefault();
    if (tapCount >= 1) {
      deactivate();
      onView(project);
    } else {
      setTimeout(() => deactivate(), 2000);
    }
  };

  useEffect(() => () => clearTimeout(touchRef.current), []);

  return (
    <motion.div
      ref={cardRef}
      animate={{ scale: active ? 1.015 : [1, 1.006, 1] }}
      transition={active
        ? { duration: 0.28, ease: "easeOut" }
        : { duration: 5.5, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }
      }
      className="relative overflow-hidden cursor-pointer rounded-2xl flex flex-col gap-3 p-5 group select-none"
      style={{
        background: `linear-gradient(150deg, ${N.deep} 0%, #160c18 60%, #100b14 100%)`,
        border: active ? `1px solid ${N.borderA}` : `1px solid ${N.border}`,
        boxShadow: active
          ? `0 0 0 1px rgba(233,168,240,0.09), 0 8px 40px rgba(157,78,221,0.17), inset 0 0 40px rgba(157,78,221,0.04)`
          : `0 0 0 1px rgba(233,168,240,0.04), 0 4px 20px rgba(0,0,0,0.45)`,
        transition: "border 0.4s ease, box-shadow 0.4s ease",
        willChange: "transform",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={() => {
        if (window.matchMedia("(hover: hover)").matches) onView(project);
      }}
    >
      {/* Mouse-tracked warm glow */}
      <div ref={glowRef}
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{ opacity: active ? 1 : 0, transition: "opacity 0.5s ease" }}
      />

      {/* Grain */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl opacity-[0.022]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "160px",
        }}
      />

      {/* Top shimmer line */}
      <div className="absolute top-0 left-6 right-6 h-px pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, rgba(233,168,240,0.16), rgba(240,194,127,0.10), transparent)` }}
      />

      {/* Floating symbol burst */}
      <AnimatePresence>
        {active && symbols.map((s) => (
          <FloatSymbol key={s.id} x={s.x} delay={s.delay} symbol={s.symbol} />
        ))}
      </AnimatePresence>

      {/* Hover/touch overlay — moon + whisper, NO rolling animation */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="absolute inset-0 z-20 rounded-2xl flex flex-col items-center justify-center gap-3 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              background: "radial-gradient(ellipse at center, rgba(17,8,18,0.86) 0%, rgba(17,8,18,0.68) 100%)",
              backdropFilter: "blur(4px)",
            }}>

            {/* Moon — spring scale-in, no roll */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1,   opacity: 1 }}
              transition={{ delay: 0.04, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
              className="text-3xl">
              🌙
            </motion.div>

            {/* Whisper — simple fade + gentle y, NO blur blur rolling */}
            <AnimatePresence mode="wait">
              <motion.p
                key={whisper}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{    opacity: 0, y: -4 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="text-center px-8 leading-relaxed italic"
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: "1.05rem",
                  color: `${N.rose}82`,
                  letterSpacing: "0.02em",
                }}>
                {whisper}
              </motion.p>
            </AnimatePresence>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="text-[9px] tracking-widest"
              style={{ color: `${N.petal}30`, fontFamily: "'Caveat', cursive" }}>
              ✦ only one person belongs here ✦
            </motion.p>

            {/* Mobile hint */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="text-[10px] md:hidden mt-0.5"
              style={{ color: `${N.petal}28` }}>
              tap again to open
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit / Delete — group-hover only (desktop) */}
      <div
        className="absolute top-4 right-4 z-30 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}>
        <button onClick={(e) => { e.stopPropagation(); onEdit(project); }}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: `${N.petal}42` }}
          onMouseEnter={(e) => e.currentTarget.style.color = N.petal}
          onMouseLeave={(e) => e.currentTarget.style.color = `${N.petal}42`}>
          <Edit2 size={13} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(project._id); }}
          className="p-1.5 rounded-lg transition-colors text-slate-500 hover:text-red-400">
          <Trash2 size={13} />
        </button>
      </div>

      {/* ── Card content ── */}
      <div className="relative z-10 flex flex-col gap-3">

        {/* Title — Caveat, warm rose gradient */}
        <div className="flex items-center gap-2.5 min-w-0 pr-14">
          <motion.span
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="text-[14px] shrink-0">
            🌙
          </motion.span>
          <p className="truncate"
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: "1.2rem",
              fontWeight: 600,
              background: `linear-gradient(135deg, ${N.rose}, ${N.petal})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "0.025em",
            }}>
            {project.title}
          </p>
        </div>

        {/* Description — Caveat, soft, NO animation */}
        {project.description && (
          <p className="text-xs line-clamp-2 leading-relaxed italic"
            style={{
              color: `${N.rose}40`,
              fontFamily: "'Caveat', cursive",
              fontSize: "0.9rem",
            }}>
            {project.description}
          </p>
        )}

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {status && <Badge className={clsx(status.color, "opacity-60 text-[10px]")}>{status.label}</Badge>}
          {project.categories?.map((cat) => {
            const meta = PROJECT_CATEGORIES.find((c) => c.value === cat);
            return meta ? (
              <span key={cat} className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium opacity-52", meta.color)}>
                {meta.icon} {meta.label}
              </span>
            ) : null;
          })}
          {project.repoLink && (
            <a href={project.repoLink} target="_blank" rel="noopener noreferrer"
              className="text-[11px] flex items-center gap-1 z-30 transition-colors"
              style={{ color: `${N.petal}42` }}
              onClick={(e) => e.stopPropagation()}>
              <GitBranch size={11} />Repo
            </a>
          )}
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
              className="text-[11px] flex items-center gap-1 z-30 transition-colors"
              style={{ color: `${N.rose}42` }}
              onClick={(e) => e.stopPropagation()}>
              <Globe size={11} />Live
            </a>
          )}
        </div>

        {/* Progress bar — warm gradient */}
        <div>
          <div className="flex justify-between text-[10px] mb-1.5" style={{ color: `${N.petal}28` }}>
            <span>progress</span><span>{project.progress}%</span>
          </div>
          <div className="h-[2px] rounded-full overflow-hidden" style={{ background: "rgba(233,168,240,0.09)" }}>
            <motion.div className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${N.bloom}, ${N.petal}, ${N.rose})` }}
              initial={{ width: 0 }}
              animate={{ width: `${project.progress}%` }}
              transition={{ duration: 1.3, ease: "easeOut" }} />
          </div>
        </div>

        {/* Milestones preview */}
        {project.milestones?.length > 0 && (
          <div className="space-y-1.5">
            {project.milestones.slice(0, 3).map((m) => (
              <div key={m._id}
                onClick={(e) => { e.stopPropagation(); onMilestoneToggle(project._id, m._id); }}
                className="flex items-center gap-2 text-xs cursor-pointer z-30"
                style={{ color: m.done ? `${N.petal}28` : `${N.rose}48` }}>
                {m.done
                  ? <CheckCircle size={12} style={{ color: N.petal }} className="shrink-0" />
                  : <Circle      size={12} style={{ color: "rgba(233,168,240,0.22)" }} className="shrink-0" />}
                <span className={m.done ? "line-through" : ""}>{m.title}</span>
              </div>
            ))}
            {project.milestones.length > 3 && (
              <p className="text-[11px] flex items-center gap-0.5" style={{ color: `${N.petal}25` }}>
                +{project.milestones.length - 3} more <ChevronRight size={9} />
              </p>
            )}
          </div>
        )}
      </div>

      {/* View hint — desktop hover only */}
      <div className="absolute bottom-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="text-[10px] flex items-center gap-0.5" style={{ color: `${N.petal}28` }}>
          View <ChevronRight size={9} />
        </span>
      </div>

      {/* Bottom shimmer line */}
      <div className="absolute bottom-0 left-6 right-6 h-px pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(233,168,240,0.09), transparent)`,
          opacity: active ? 1 : 0.35,
          transition: "opacity 0.5s ease",
        }}
      />
    </motion.div>
  );
}