"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Star, Zap, Crown, Flame, Diamond } from "lucide-react";

// ── Rarity config ─────────────────────────────────────────────────────────────
const RARITY = {
  common:    { label: "Common",    color: "#94a3b8", glow: "rgba(148,163,184,0.25)", gradient: "from-slate-500 to-slate-400",    particles: 8,  bg: "from-slate-900 via-slate-800"  },
  uncommon:  { label: "Uncommon",  color: "#4ade80", glow: "rgba(74,222,128,0.3)",   gradient: "from-green-500 to-emerald-400",  particles: 12, bg: "from-emerald-950 via-slate-900" },
  rare:      { label: "Rare",      color: "#60a5fa", glow: "rgba(96,165,250,0.35)",  gradient: "from-blue-500 to-cyan-400",      particles: 16, bg: "from-blue-950 via-slate-900"   },
  epic:      { label: "Epic",      color: "#c084fc", glow: "rgba(192,132,252,0.4)",  gradient: "from-purple-500 to-violet-400",  particles: 20, bg: "from-purple-950 via-slate-900"  },
  legendary: { label: "Legendary", color: "#fb923c", glow: "rgba(251,146,60,0.45)",  gradient: "from-orange-500 to-amber-400",   particles: 24, bg: "from-orange-950 via-slate-900"  },
  mythic:    { label: "Mythic",    color: "#f472b6", glow: "rgba(244,114,182,0.5)",  gradient: "from-pink-500 via-purple-500 to-cyan-400", particles: 32, bg: "from-pink-950 via-purple-950" },
};

const RARITY_ICON = {
  common:    <Star    size={10} />,
  uncommon:  <Zap     size={10} />,
  rare:      <Diamond size={10} />,
  epic:      <Flame   size={10} />,
  legendary: <Crown   size={10} />,
  mythic:    <Crown   size={10} />,
};

// Per-achievement colors that override rarity color for badge ring
const BADGE_COLORS = {
  habit_streak_3:   "#86efac", habit_streak_7:   "#fb923c", habit_streak_14:  "#f59e0b",
  habit_streak_21:  "#a78bfa", habit_streak_30:  "#a855f7", habit_streak_60:  "#6366f1",
  habit_streak_100: "#22d3ee", habit_streak_365: "#f472b6",
  tasks_1:   "#4ade80", tasks_10:  "#10b981", tasks_25:  "#3b82f6",
  tasks_50:  "#60a5fa", tasks_100: "#f59e0b", tasks_250: "#c084fc", tasks_500: "#f472b6",
  projects_1: "#818cf8", projects_3: "#8b5cf6", projects_5: "#a855f7",
  projects_10: "#ec4899", projects_20: "#f472b6",
  learning_1:  "#22d3ee", learning_5:  "#06b6d4", learning_10: "#0ea5e9",
  learning_20: "#a855f7", learning_50: "#7c3aed", learning_100: "#f472b6",
  journal_1:  "#fb923c", journal_7:   "#f97316", journal_30:  "#ef4444",
  journal_100: "#dc2626", journal_365: "#f472b6",
  knowledge_1:  "#4ade80", knowledge_10: "#10b981", knowledge_25: "#059669",
  knowledge_50: "#047857", knowledge_100: "#f472b6",
  budget_first: "#22c55e", budget_10: "#16a34a", budget_50: "#15803d", budget_100: "#14532d",
  ideas_1:  "#fbbf24", ideas_10: "#f59e0b", ideas_25: "#d97706", ideas_50: "#b45309",
};

// ── Particle burst canvas ─────────────────────────────────────────────────────
function ParticleBurst({ color, count }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const cx = W / 2, cy = H / 2;

    const particles = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      return {
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 2,
        life: 1,
        decay: 0.015 + Math.random() * 0.02,
        size: 2 + Math.random() * 4,
        color,
      };
    });

    let raf;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.12;
        p.life -= p.decay;
        if (p.life > 0) {
          alive = true;
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (alive) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [color, count]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ borderRadius: "inherit" }}
    />
  );
}

// ── Single achievement toast ──────────────────────────────────────────────────
function AchievementToast({ achievement, onDismiss, stackIndex = 0 }) {
  const [phase, setPhase] = useState("enter");
  const [showParticles, setShowParticles] = useState(false);
  const r = RARITY[achievement.rarity] || RARITY.common;
  const badgeColor = BADGE_COLORS[achievement.key] || r.color;
  const isMythic = achievement.rarity === "mythic";
  const isLegendary = achievement.rarity === "legendary" || isMythic;

  useEffect(() => {
    // Stagger entry for stacked notifications
    const delay = stackIndex * 80;
    const t1 = setTimeout(() => setPhase("show"), 50 + delay);
    const t2 = setTimeout(() => setShowParticles(true), 300 + delay);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [stackIndex]);

  const dismiss = () => {
    setPhase("exit");
    setTimeout(() => onDismiss(achievement._id), 500);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border cursor-default select-none transition-all duration-500 ease-out`}
      style={{
        background: `linear-gradient(135deg, #0a0d14 0%, #111827 50%, #0a0d14 100%)`,
        borderColor: `${badgeColor}35`,
        boxShadow: `0 0 0 1px ${badgeColor}20, 0 8px 32px rgba(0,0,0,0.6), 0 0 60px ${r.glow}`,
        minWidth: 340,
        maxWidth: 400,
        opacity: phase === "enter" ? 0 : phase === "exit" ? 0 : 1,
        transform: phase === "enter"
          ? "translateX(60px) scale(0.9)"
          : phase === "exit"
          ? "translateX(60px) scale(0.95) opacity(0)"
          : "translateX(0) scale(1)",
      }}
    >
      {/* Particle burst */}
      {showParticles && <ParticleBurst color={badgeColor} count={r.particles} />}

      {/* Top shimmer line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent 0%, ${badgeColor}80 50%, transparent 100%)` }}
      />

      {/* Mythic / legendary animated border glow */}
      {isLegendary && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${badgeColor}15 0%, transparent 70%)`,
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
      )}

      <div className="relative flex items-start gap-4 px-5 py-4">
        {/* Badge */}
        <div className="relative shrink-0 mt-0.5">
          {/* Outer glow ring */}
          <div
            className="absolute inset-0 rounded-2xl animate-ping opacity-20"
            style={{ background: badgeColor, animationDuration: "2s" }}
          />
          <div
            className="relative h-[60px] w-[60px] rounded-2xl flex items-center justify-center text-3xl border-2 z-10"
            style={{
              background: `radial-gradient(circle at 40% 30%, ${badgeColor}30 0%, ${badgeColor}08 100%)`,
              borderColor: `${badgeColor}50`,
              boxShadow: `0 0 24px ${badgeColor}40, inset 0 1px 0 ${badgeColor}20`,
            }}
          >
            {achievement.icon}
          </div>
          {/* Rarity corner gem */}
          <div
            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full flex items-center justify-center z-20 border-2"
            style={{ background: badgeColor, borderColor: "#0a0d14", color: "#0a0d14" }}
          >
            {RARITY_ICON[achievement.rarity] || <Star size={9} />}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          {/* Rarity label */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border"
              style={{
                color: badgeColor,
                borderColor: `${badgeColor}40`,
                background: `${badgeColor}12`,
              }}
            >
              {r.label} Achievement
            </span>
            {isMythic && (
              <span className="text-[9px] font-black uppercase tracking-widest text-pink-400 animate-pulse">
                ✦ MYTHIC ✦
              </span>
            )}
          </div>

          {/* Title */}
          <p
            className="font-black text-base leading-tight text-white"
            style={{ textShadow: `0 0 20px ${badgeColor}40` }}
          >
            {achievement.title}
          </p>

          {/* Description */}
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {achievement.description}
          </p>
        </div>

        {/* Dismiss X */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-all z-30"
        >
          <X size={14} />
        </button>
      </div>

      {/* Bottom accent */}
      <div
        className="h-1 w-full"
        style={{
          background: isMythic
            ? `linear-gradient(90deg, #f472b6, #a855f7, #22d3ee, #f472b6)`
            : `linear-gradient(90deg, transparent, ${badgeColor}60, transparent)`,
          backgroundSize: isMythic ? "200% 100%" : "100%",
          animation: isMythic ? "shimmer 2s linear infinite" : undefined,
        }}
      />

      <style jsx>{`
        @keyframes shimmer {
          0%   { background-position: 0% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Queue: shows ALL unlocked at once, stacked ────────────────────────────────
export function AchievementPopupQueue({ queue, onDismiss }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || queue.length === 0) return null;

  return createPortal(
    <div
      className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 pointer-events-none"
      style={{ maxWidth: 400 }}
    >
      {queue.map((achievement, i) => (
        <div key={achievement._id} className="pointer-events-auto">
          <AchievementToast
            achievement={achievement}
            onDismiss={onDismiss}
            stackIndex={i}
          />
        </div>
      ))}
    </div>,
    document.body
  );
}
