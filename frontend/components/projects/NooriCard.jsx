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

const statusMeta = (v) => PROJECT_STATUSES.find((s) => s.value === v);

// ─────────────────────────────────────────────────────────────────────────────
// Floating particle — tiny star that drifts up
// ─────────────────────────────────────────────────────────────────────────────
function Particle({ x, delay }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, bottom: 0 }}
      initial={{ opacity: 0, y: 0, scale: 0 }}
      animate={{ opacity: [0, 0.6, 0], y: -60, scale: [0, 1, 0] }}
      transition={{ duration: 2.2, delay, ease: "easeOut" }}
    >
      <div
        className="rounded-full"
        style={{
          width: Math.random() * 3 + 1.5 + "px",
          height: Math.random() * 3 + 1.5 + "px",
          background: Math.random() > 0.5 ? "#c084fc" : "#7c3aed",
          boxShadow: "0 0 4px #c084fc88",
        }}
      />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ambient wind-chime via Web Audio (no external file)
// ─────────────────────────────────────────────────────────────────────────────
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
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
// ── Noori Drawer ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
export function NooriDrawer({ projectId, onClose, onEdit, onDelete, onMilestoneToggle }) {
  const [project,  setProject]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [toggling, setToggling] = useState(null);
  const [entered,  setEntered]  = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    api.get(`/projects/${projectId}`)
      .then((r) => { setProject(r.data.data); setTimeout(() => setEntered(true), 80); })
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

  // Staggered particles on open
  const particles = Array.from({ length: 14 }, (_, i) => ({
    id: i, x: 5 + Math.random() * 90, delay: i * 0.12,
  }));

  return (
    <>
      {/* ── Backdrop ────────────────────────────────────────────────────── */}
      <motion.div
        className="fixed inset-0 z-40"
        style={{ background: "radial-gradient(ellipse at 70% 50%, rgba(124,58,237,0.12) 0%, rgba(0,0,0,0.65) 100%)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* ── Panel ───────────────────────────────────────────────────────── */}
      <motion.div
        className="fixed right-0 top-0 h-full z-50 w-full max-w-lg flex flex-col overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0f0a1e 0%, #0d0d14 40%, #080810 100%)",
          borderLeft: "1px solid rgba(124,58,237,0.18)",
          boxShadow: "-8px 0 60px rgba(124,58,237,0.12), -1px 0 0 rgba(192,132,252,0.06)",
        }}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
      >
        {/* ── Ambient star field ────────────────────────────────────────── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(28)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top:  `${Math.random() * 100}%`,
                width:  Math.random() * 1.5 + 0.5 + "px",
                height: Math.random() * 1.5 + 0.5 + "px",
                background: "#c084fc",
              }}
              animate={{ opacity: [0.1, 0.5, 0.1] }}
              transition={{
                duration: 2.5 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 4,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* ── Glow orb top-right ────────────────────────────────────────── */}
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div
          className="relative flex items-start gap-4 px-6 py-6"
          style={{ borderBottom: "1px solid rgba(124,58,237,0.12)" }}
        >
          {/* Moon glyph */}
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="text-2xl shrink-0 mt-0.5"
          >
            🌙
          </motion.div>

          <div className="flex-1 min-w-0">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-xl font-semibold leading-snug"
              style={{
                fontFamily: "'Outfit', sans-serif",
                background: "linear-gradient(135deg, #e9d5ff, #c084fc, #a78bfa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "0.01em",
              }}
            >
              {loading ? "…" : project?.title}
            </motion.h2>

            {status && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="mt-1.5"
              >
                <Badge className={clsx(status.color, "opacity-80")}>{status.label}</Badge>
              </motion.div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {project && (
              <>
                <button onClick={handleEdit}
                  className="p-2 rounded-lg text-purple-400/60 hover:text-purple-300 hover:bg-purple-900/20 transition-colors">
                  <Edit2 size={15} />
                </button>
                <button onClick={handleDelete}
                  className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/10 transition-colors">
                  <Trash2 size={15} />
                </button>
              </>
            )}
            <button onClick={onClose}
              className="p-2 rounded-lg text-purple-400/40 hover:text-purple-200 hover:bg-purple-900/20 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 size={22} style={{ color: "#c084fc" }} />
            </motion.div>
            <span className="text-sm text-purple-300/40"
              style={{ fontFamily: "'Dancing Script', cursive" }}>
              Opening the universe…
            </span>
          </div>
        ) : !project ? (
          <div className="flex-1 flex items-center justify-center text-purple-300/30 text-sm italic"
            style={{ fontFamily: "'Dancing Script', cursive" }}>
            The universe could not be found.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">

            {/* ── Hero banner — description as prose ──────────────────── */}
            {project.description && (
              <motion.div
                className="relative px-6 py-7 overflow-hidden"
                style={{ borderBottom: "1px solid rgba(124,58,237,0.08)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(135deg, rgba(124,58,237,0.06) 0%, transparent 60%)",
                  }}
                />
                <p
                  className="relative text-sm leading-[1.9] text-purple-200/60 italic"
                  style={{ fontFamily: "'Dancing Script', cursive", fontSize: "1.05rem" }}
                >
                  {project.description}
                </p>
                {/* Decorative quote mark */}
                <div
                  className="absolute top-4 left-5 text-6xl leading-none pointer-events-none select-none"
                  style={{ color: "rgba(124,58,237,0.08)", fontFamily: "Georgia, serif" }}
                >
                  "
                </div>
              </motion.div>
            )}

            {/* ── Stats ───────────────────────────────────────────────── */}
            <motion.div
              className="grid grid-cols-3 gap-3 px-6 py-5"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
            >
              {[
                {
                  label: "progress",
                  value: (
                    <NooriProgressRing value={project.progress} />
                  ),
                },
                {
                  label: "milestones",
                  value: <><span className="text-2xl font-bold text-purple-100">{done}</span><span className="text-sm text-purple-400/40">/{total}</span></>,
                  icon: <Target size={11} />,
                },
                {
                  label: "linked tasks",
                  value: <span className="text-2xl font-bold text-purple-100">{totalTasks}</span>,
                  icon: <BarChart3 size={11} />,
                },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                  className="rounded-xl p-4 flex flex-col items-center justify-center gap-1 text-center"
                  style={{
                    background: "rgba(124,58,237,0.06)",
                    border: "1px solid rgba(124,58,237,0.12)",
                  }}
                >
                  <div className="flex items-center gap-1 justify-center">{s.value}</div>
                  <p className="text-[10px] text-purple-400/40 flex items-center gap-0.5 mt-0.5">
                    {s.icon}{s.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* ── Categories ──────────────────────────────────────────── */}
            {project.categories?.length > 0 && (
              <Section>
                <Label>Categories</Label>
                <div className="flex gap-2 flex-wrap">
                  {project.categories.map((cat) => {
                    const meta = PROJECT_CATEGORIES.find((c) => c.value === cat);
                    return meta ? (
                      <span key={cat} className={clsx("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium opacity-80", meta.color)}>
                        {meta.icon} {meta.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </Section>
            )}

            {/* ── Links ───────────────────────────────────────────────── */}
            {(project.repoLink || project.liveUrl) && (
              <Section>
                <div className="space-y-2">
                  {project.repoLink && (
                    <div>
                      <Label>Repository</Label>
                      <a href={project.repoLink} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-purple-400/70 hover:text-purple-300 transition-colors break-all">
                        <GitBranch size={13} />{project.repoLink}<ExternalLink size={11} className="shrink-0" />
                      </a>
                    </div>
                  )}
                  {project.liveUrl && (
                    <div>
                      <Label>Live Site</Label>
                      <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-purple-300/70 hover:text-purple-200 transition-colors break-all">
                        <Globe size={13} />{project.liveUrl}<ExternalLink size={11} className="shrink-0" />
                      </a>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* ── Milestones ──────────────────────────────────────────── */}
            {total > 0 && (
              <Section>
                <div className="flex items-center justify-between mb-4">
                  <Label className="mb-0">Milestones</Label>
                  <span className="text-xs text-purple-400/40">{done}/{total} complete</span>
                </div>

                {/* Custom purple progress bar */}
                <div className="h-px w-full mb-4 rounded-full overflow-hidden"
                  style={{ background: "rgba(124,58,237,0.12)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #7c3aed, #c084fc)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${project.progress}%` }}
                    transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
                  />
                </div>

                <div className="space-y-2">
                  {project.milestones.map((m, idx) => (
                    <motion.button
                      key={m._id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + idx * 0.06 }}
                      onClick={() => handleMilestone(m._id)}
                      disabled={toggling === m._id}
                      className={clsx(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                        toggling === m._id && "opacity-40 pointer-events-none"
                      )}
                      style={{
                        background: m.done
                          ? "rgba(124,58,237,0.08)"
                          : "rgba(255,255,255,0.02)",
                        border: m.done
                          ? "1px solid rgba(124,58,237,0.2)"
                          : "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      {m.done
                        ? <CheckCircle size={16} style={{ color: "#c084fc" }} className="shrink-0" />
                        : <Circle     size={16} style={{ color: "rgba(124,58,237,0.3)" }} className="shrink-0" />}
                      <span className={clsx(
                        "text-sm flex-1 text-left",
                        m.done ? "line-through text-purple-500/40" : "text-purple-200/70"
                      )}>
                        {m.title}
                      </span>
                      {m.dueDate && (
                        <span className="text-[10px] text-purple-500/40 flex items-center gap-1 shrink-0">
                          <Calendar size={10} />{new Date(m.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </motion.button>
                  ))}
                </div>
              </Section>
            )}

            {/* ── Task breakdown ───────────────────────────────────────── */}
            {totalTasks > 0 && (
              <Section>
                <Label>Tasks by status</Label>
                <div className="space-y-1.5">
                  {Object.entries(taskCounts).map(([st, count]) => (
                    <div key={st}
                      className="flex items-center justify-between rounded-lg px-3 py-2"
                      style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.08)" }}>
                      <span className="text-sm text-purple-300/50 capitalize">{st.replace(/-/g, " ")}</span>
                      <span className="text-sm font-medium text-purple-200/70">{count}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* ── Notes ───────────────────────────────────────────────── */}
            {project.notes && (
              <Section>
                <Label>Notes</Label>
                <div
                  className="rounded-xl px-5 py-4"
                  style={{
                    background: "rgba(124,58,237,0.04)",
                    border: "1px solid rgba(124,58,237,0.1)",
                  }}
                >
                  <p
                    className="text-sm leading-relaxed whitespace-pre-wrap text-purple-200/50 italic"
                    style={{ fontFamily: "'Dancing Script', cursive", fontSize: "0.95rem" }}
                  >
                    {project.notes}
                  </p>
                </div>
              </Section>
            )}

            {/* ── Timestamps ──────────────────────────────────────────── */}
            <div
              className="px-6 py-4 text-[11px] text-purple-500/30 space-y-0.5"
              style={{ borderTop: "1px solid rgba(124,58,237,0.06)" }}
            >
              <span className="block">Created {new Date(project.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
              <span className="block">Last updated {new Date(project.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>

          </div>
        )}

        {/* ── Footer ────────────────────────────────────────────────────── */}
        {project && (
          <div
            className="px-6 py-4 shrink-0"
            style={{ borderTop: "1px solid rgba(124,58,237,0.1)" }}
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleEdit}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
              style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(192,132,252,0.12))",
                border: "1px solid rgba(124,58,237,0.3)",
                color: "#c084fc",
              }}
            >
              <Edit2 size={14} /> Edit Project
            </motion.button>
          </div>
        )}
      </motion.div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Noori Progress Ring — purple themed
// ─────────────────────────────────────────────────────────────────────────────
function NooriProgressRing({ value, size = 56 }) {
  const r    = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(124,58,237,0.12)" strokeWidth={4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="url(#nooriGrad)" strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1.2s ease" }} />
      <defs>
        <linearGradient id="nooriGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
      </defs>
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        transform={`rotate(90,${size/2},${size/2})`}
        fill="#c084fc" fontSize={11} fontWeight={600}>{value}%</text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers for drawer
// ─────────────────────────────────────────────────────────────────────────────
function Section({ children }) {
  return (
    <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(124,58,237,0.06)" }}>
      {children}
    </div>
  );
}
function Label({ children, className = "mb-3" }) {
  return (
    <p className={clsx("text-[10px] font-semibold uppercase tracking-widest text-purple-500/40 mb-3", className)}>
      {children}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── Noori Card ───────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
export default function NooriCard({ project, onView, onEdit, onDelete, onMilestoneToggle }) {
  const status = statusMeta(project.status);
  const done   = project.milestones?.filter((m) => m.done).length || 0;

  // ── Interaction state ────────────────────────────────────────────────────
  const [active,      setActive]      = useState(false); // hover OR touch
  const [whisper,     setWhisper]     = useState("");
  const [particles,   setParticles]   = useState([]);
  const [chimeReady,  setChimeReady]  = useState(false); // first touch guard

  const cardRef  = useRef(null);
  const glowRef  = useRef(null);
  const touchRef = useRef(null); // timer ref for long-press / tap

  // ── Spring glow ──────────────────────────────────────────────────────────
  const rawX  = useMotionValue(0.5);
  const rawY  = useMotionValue(0.5);
  const glowX = useSpring(rawX, { stiffness: 100, damping: 18 });
  const glowY = useSpring(rawY, { stiffness: 100, damping: 18 });

  const writeGlow = useCallback(() => {
    if (!glowRef.current) return;
    const x = glowX.get() * 100;
    const y = glowY.get() * 100;
    glowRef.current.style.background =
      `radial-gradient(circle at ${x}% ${y}%, rgba(124,58,237,0.26) 0%, rgba(192,132,252,0.08) 38%, transparent 68%)`;
  }, []);

  useEffect(() => {
    const ux = glowX.on("change", writeGlow);
    const uy = glowY.on("change", writeGlow);
    return () => { ux(); uy(); };
  }, []);

  // ── Activate (hover/touch) ────────────────────────────────────────────────
  const activate = useCallback((clientX, clientY) => {
    setChimeReady(true);
    setActive(true);
    // Fresh whisper
    setWhisper((prev) => {
      const pool = WHISPERS.filter((w) => w !== prev);
      return pool[Math.floor(Math.random() * pool.length)];
    });
    // Particles burst
    setParticles(
      Array.from({ length: 10 }, (_, i) => ({
        id: Date.now() + i,
        x: 10 + Math.random() * 80,
        delay: i * 0.08,
      }))
    );
    // Position glow
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect && clientX !== undefined) {
      rawX.set((clientX - rect.left) / rect.width);
      rawY.set((clientY - rect.top)  / rect.height);
    }
    // Sound
    if (chimeReady) playChime();
  }, [chimeReady]);

  const deactivate = useCallback(() => {
    setActive(false);
    rawX.set(0.5); rawY.set(0.5);
  }, []);

  // ── Mouse events ──────────────────────────────────────────────────────────
  const onMouseEnter = (e) => activate(e.clientX, e.clientY);
  const onMouseLeave = () => deactivate();
  const onMouseMove  = useCallback((e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left) / rect.width);
    rawY.set((e.clientY - rect.top)  / rect.height);
  }, []);

  // ── Touch events (mobile) ─────────────────────────────────────────────────
  // Tap → activate for 2s to show overlay, then auto-deactivate
  // Second tap = open drawer (onView)
  const [tapCount, setTapCount] = useState(0);

  const onTouchStart = (e) => {
    const t = e.touches[0];
    activate(t.clientX, t.clientY);
    setTapCount((c) => c + 1);
    // Auto-reset tap count after 600ms
    clearTimeout(touchRef.current);
    touchRef.current = setTimeout(() => setTapCount(0), 600);
  };

  const onTouchEnd = (e) => {
    e.preventDefault();
    // If tapped twice quickly → open drawer
    if (tapCount >= 1) {
      deactivate();
      onView(project);
    } else {
      // First tap: show overlay for 2s
      setTimeout(() => deactivate(), 2000);
    }
  };

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => () => clearTimeout(touchRef.current), []);

  return (
    <motion.div
      ref={cardRef}
      // Breathing
      animate={{ scale: active ? 1.015 : [1, 1.007, 1] }}
      transition={active
        ? { duration: 0.3, ease: "easeOut" }
        : { duration: 5, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }
      }
      className="relative overflow-hidden cursor-pointer rounded-xl flex flex-col gap-3 p-5 group select-none"
      style={{
        background: "linear-gradient(145deg, #0e0820 0%, #0a0618 100%)",
        border: active
          ? "1px solid rgba(192,132,252,0.35)"
          : "1px solid rgba(124,58,237,0.18)",
        boxShadow: active
          ? "0 0 0 1px rgba(192,132,252,0.12), 0 8px 40px rgba(124,58,237,0.2), inset 0 0 40px rgba(124,58,237,0.04)"
          : "0 0 0 1px rgba(124,58,237,0.06), 0 4px 20px rgba(0,0,0,0.4)",
        transition: "border 0.4s ease, box-shadow 0.4s ease",
        willChange: "transform",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={(e) => {
        // Desktop click
        if (window.matchMedia("(hover: hover)").matches) onView(project);
      }}
    >
      {/* ── Mouse glow ──────────────────────────────────────────────────── */}
      <div
        ref={glowRef}
        className="absolute inset-0 pointer-events-none rounded-xl"
        style={{ opacity: active ? 1 : 0, transition: "opacity 0.5s ease" }}
      />

      {/* ── Grain texture ────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none rounded-xl opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "160px",
        }}
      />

      {/* ── Floating particles ───────────────────────────────────────────── */}
      <AnimatePresence>
        {active && particles.map((p) => <Particle key={p.id} x={p.x} delay={p.delay} />)}
      </AnimatePresence>

      {/* ── Lock overlay ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="absolute inset-0 z-20 rounded-xl flex flex-col items-center justify-center gap-3 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            style={{
              background: "radial-gradient(ellipse at center, rgba(8,4,20,0.78) 0%, rgba(8,4,20,0.6) 100%)",
              backdropFilter: "blur(3px)",
            }}
          >
            {/* Lock */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 10 }}
              animate={{ scale: 1,   opacity: 1, y: 0  }}
              transition={{ delay: 0.06, duration: 0.5, ease: [0.34,1.56,0.64,1] }}
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
                stroke="rgba(192,132,252,0.9)" strokeWidth="1.4"
                strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </motion.div>

            {/* Whisper */}
            <AnimatePresence mode="wait">
              <motion.p
                key={whisper}
                initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
                animate={{ opacity: 1, y: 0,  filter: "blur(0px)" }}
                exit={{    opacity: 0, y: -6,  filter: "blur(3px)" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-center px-8 leading-relaxed"
                style={{
                  fontFamily: "'Dancing Script', cursive",
                  fontSize: "0.92rem",
                  color: "rgba(216,180,254,0.75)",
                  letterSpacing: "0.02em",
                }}
              >
                {whisper}
              </motion.p>
            </AnimatePresence>

            {/* Mobile hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-[10px] text-purple-500/35 md:hidden mt-1"
            >
              tap again to open
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Edit / Delete ────────────────────────────────────────────────── */}
      <div
        className="absolute top-4 right-4 z-30 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={(e) => { e.stopPropagation(); onEdit(project); }}
          className="p-1.5 rounded-md text-purple-400/50 hover:text-purple-300 hover:bg-purple-900/30 transition-colors">
          <Edit2 size={13} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(project._id); }}
          className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-900/15 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>

      {/* ── Card content ─────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col gap-3">

        {/* Title */}
        <div className="flex items-center gap-2.5 min-w-0 pr-14">
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-[13px] shrink-0"
          >
            🌙
          </motion.span>
          <p
            className="font-semibold truncate"
            style={{
              fontFamily: "'Outfit', sans-serif",
              background: "linear-gradient(135deg, #e9d5ff, #c084fc)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "0.01em",
            }}
          >
            {project.title}
          </p>
        </div>

        {/* Description */}
        {project.description && (
          <p
            className="text-xs line-clamp-2 leading-relaxed italic"
            style={{ color: "rgba(192,132,252,0.38)", fontFamily: "'Dancing Script', cursive", fontSize: "0.78rem" }}
          >
            {project.description}
          </p>
        )}

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {status && <Badge className={clsx(status.color, "opacity-70 text-[10px]")}>{status.label}</Badge>}
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
              className="text-[11px] flex items-center gap-1 transition-colors z-30"
              style={{ color: "rgba(192,132,252,0.45)" }}
              onClick={(e) => e.stopPropagation()}>
              <GitBranch size={11} />Repo
            </a>
          )}
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
              className="text-[11px] flex items-center gap-1 transition-colors z-30"
              style={{ color: "rgba(192,132,252,0.45)" }}
              onClick={(e) => e.stopPropagation()}>
              <Globe size={11} />Live
            </a>
          )}
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-[10px] mb-1.5" style={{ color: "rgba(192,132,252,0.3)" }}>
            <span>Progress</span><span>{project.progress}%</span>
          </div>
          <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(124,58,237,0.12)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #7c3aed, #c084fc)" }}
              initial={{ width: 0 }}
              animate={{ width: `${project.progress}%` }}
              transition={{ duration: 1.3, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Milestones preview */}
        {project.milestones?.length > 0 && (
          <div className="space-y-1.5">
            {project.milestones.slice(0, 3).map((m) => (
              <div
                key={m._id}
                onClick={(e) => { e.stopPropagation(); onMilestoneToggle(project._id, m._id); }}
                className="flex items-center gap-2 text-xs cursor-pointer transition-colors z-30"
                style={{ color: m.done ? "rgba(124,58,237,0.35)" : "rgba(192,132,252,0.45)" }}
              >
                {m.done
                  ? <CheckCircle size={12} style={{ color: "#9f67fa" }} className="shrink-0" />
                  : <Circle      size={12} style={{ color: "rgba(124,58,237,0.28)" }} className="shrink-0" />}
                <span className={m.done ? "line-through" : ""}>{m.title}</span>
              </div>
            ))}
            {project.milestones.length > 3 && (
              <p className="text-[11px] flex items-center gap-0.5" style={{ color: "rgba(124,58,237,0.3)" }}>
                +{project.milestones.length - 3} more <ChevronRight size={9} />
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── "View" hint ──────────────────────────────────────────────────── */}
      <div className="absolute bottom-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="text-[10px] flex items-center gap-0.5" style={{ color: "rgba(124,58,237,0.35)" }}>
          View <ChevronRight size={9} />
        </span>
      </div>

      {/* ── Vignette ─────────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          boxShadow: "inset 0 0 80px rgba(124,58,237,0.06)",
          opacity: active ? 1 : 0.5,
          transition: "opacity 0.6s ease",
        }}
      />
    </motion.div>
  );
}