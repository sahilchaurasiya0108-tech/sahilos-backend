"use client";

import { useState, useMemo } from "react";
import { useAchievements } from "@/hooks/useAchievements";
import { Spinner } from "@/components/ui";
import PageWrapper from "@/components/layout/PageWrapper";
import { RefreshCw, X, Lock, CheckCircle2, Star, Zap, Diamond, Flame, Crown, Trophy, Search } from "lucide-react";
import { createPortal } from "react-dom";
import clsx from "clsx";

// ── Rarity system ─────────────────────────────────────────────────────────────
const RARITY_CONFIG = {
  common:    { label: "Common",    color: "#94a3b8", glow: "rgba(148,163,184,0.2)", bg: "rgba(148,163,184,0.06)", border: "rgba(148,163,184,0.2)", icon: <Star size={11} />,    textClass: "text-slate-400"  },
  uncommon:  { label: "Uncommon",  color: "#4ade80", glow: "rgba(74,222,128,0.2)",  bg: "rgba(74,222,128,0.06)",  border: "rgba(74,222,128,0.2)",  icon: <Zap size={11} />,     textClass: "text-green-400"  },
  rare:      { label: "Rare",      color: "#60a5fa", glow: "rgba(96,165,250,0.25)", bg: "rgba(96,165,250,0.07)",  border: "rgba(96,165,250,0.25)", icon: <Diamond size={11} />, textClass: "text-blue-400"   },
  epic:      { label: "Epic",      color: "#c084fc", glow: "rgba(192,132,252,0.3)", bg: "rgba(192,132,252,0.08)", border: "rgba(192,132,252,0.3)", icon: <Flame size={11} />,   textClass: "text-purple-400" },
  legendary: { label: "Legendary", color: "#fb923c", glow: "rgba(251,146,60,0.35)", bg: "rgba(251,146,60,0.08)",  border: "rgba(251,146,60,0.35)", icon: <Crown size={11} />,   textClass: "text-orange-400" },
  mythic:    { label: "Mythic",    color: "#f472b6", glow: "rgba(244,114,182,0.4)", bg: "rgba(244,114,182,0.08)", border: "rgba(244,114,182,0.4)", icon: <Crown size={11} />,   textClass: "text-pink-400"   },
};

const RARITY_ORDER = ["mythic", "legendary", "epic", "rare", "uncommon", "common"];

const BADGE_COLORS = {
  habit_streak_3:   "#86efac", habit_streak_7:   "#fb923c", habit_streak_14: "#f59e0b",
  habit_streak_21:  "#a78bfa", habit_streak_30:  "#a855f7", habit_streak_60: "#6366f1",
  habit_streak_100: "#22d3ee", habit_streak_365: "#f472b6",
  tasks_1:   "#4ade80", tasks_10:  "#10b981", tasks_25: "#3b82f6",
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

// ── Achievement Card ──────────────────────────────────────────────────────────
function AchievementCard({ achievement, onClick }) {
  const r = RARITY_CONFIG[achievement.rarity] || RARITY_CONFIG.common;
  const badgeColor = BADGE_COLORS[achievement.key] || r.color;
  const isUnlocked = achievement.unlocked;
  const isMythic = achievement.rarity === "mythic";

  return (
    <div
      onClick={() => isUnlocked && onClick(achievement)}
      className={clsx(
        "relative rounded-2xl border overflow-hidden transition-all duration-300 group",
        isUnlocked
          ? "cursor-pointer hover:scale-[1.03] hover:-translate-y-0.5"
          : "opacity-50 cursor-default"
      )}
      style={{
        background: isUnlocked
          ? `linear-gradient(135deg, #0d1117 0%, #111827 100%)`
          : "#0d1117",
        borderColor: isUnlocked ? `${badgeColor}30` : "#1e2535",
        boxShadow: isUnlocked
          ? `0 0 0 1px ${badgeColor}15, 0 4px 20px rgba(0,0,0,0.4), 0 0 40px ${r.glow}`
          : "none",
      }}
    >
      {/* Mythic shimmer */}
      {isMythic && isUnlocked && (
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: `linear-gradient(135deg, transparent 0%, ${badgeColor}20 50%, transparent 100%)`,
            animation: "mythicShimmer 3s ease-in-out infinite",
          }}
        />
      )}

      {/* Top color accent line */}
      {isUnlocked && (
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${badgeColor}70, transparent)` }}
        />
      )}

      <div className="p-4">
        {/* Icon + rarity badge */}
        <div className="flex items-start justify-between mb-3">
          <div
            className="h-14 w-14 rounded-xl flex items-center justify-center text-2xl border-2 relative"
            style={isUnlocked ? {
              background: `radial-gradient(circle at 35% 35%, ${badgeColor}25, ${badgeColor}06)`,
              borderColor: `${badgeColor}45`,
              boxShadow: `0 0 16px ${badgeColor}30, inset 0 1px 0 ${badgeColor}15`,
            } : {
              background: "#1e2535",
              borderColor: "#252d40",
              filter: "grayscale(1)",
            }}
          >
            {achievement.icon}
            {isUnlocked && (
              <div
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full flex items-center justify-center border-2"
                style={{ background: badgeColor, borderColor: "#0d1117", color: "#0d1117" }}
              >
                {r.icon}
              </div>
            )}
            {!isUnlocked && (
              <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-[#1e2535] border border-[#252d40] flex items-center justify-center">
                <Lock size={9} className="text-slate-600" />
              </div>
            )}
          </div>

          {/* Rarity pill */}
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border"
            style={isUnlocked ? {
              color: r.color, background: r.bg, borderColor: r.border,
            } : {
              color: "#374151", background: "#111827", borderColor: "#1f2937",
            }}
          >
            {r.label}
          </span>
        </div>

        {/* Title + description */}
        <p className={clsx(
          "font-bold text-sm leading-tight mb-1",
          isUnlocked ? "text-slate-100" : "text-slate-600"
        )}>
          {achievement.title}
        </p>
        <p className={clsx(
          "text-xs leading-relaxed",
          isUnlocked ? "text-slate-500" : "text-slate-700"
        )}>
          {achievement.description}
        </p>

        {/* Unlock date */}
        {isUnlocked && achievement.unlockedAt && (
          <p className="text-[10px] mt-2 font-medium" style={{ color: `${badgeColor}80` }}>
            ✦ {new Date(achievement.unlockedAt).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric"
            })}
          </p>
        )}
      </div>

      {/* Bottom accent */}
      {isUnlocked && (
        <div
          className="h-0.5"
          style={{
            background: isMythic
              ? `linear-gradient(90deg, #f472b6, #a855f7, #22d3ee)`
              : `linear-gradient(90deg, transparent, ${badgeColor}50, transparent)`,
          }}
        />
      )}

      <style jsx>{`
        @keyframes mythicShimmer {
          0%, 100% { transform: translateX(-100%); }
          50%       { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({ achievement, onClose }) {
  const r = RARITY_CONFIG[achievement.rarity] || RARITY_CONFIG.common;
  const badgeColor = BADGE_COLORS[achievement.key] || r.color;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-sm rounded-3xl border overflow-hidden shadow-2xl"
          style={{
            background: "linear-gradient(135deg, #0a0d14 0%, #111827 100%)",
            borderColor: `${badgeColor}35`,
            boxShadow: `0 0 0 1px ${badgeColor}20, 0 32px 80px rgba(0,0,0,0.8), 0 0 80px ${r.glow}`,
          }}
        >
          {/* Top shimmer */}
          <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${badgeColor}, transparent)` }} />

          {/* Hero section */}
          <div className="px-8 pt-8 pb-6 text-center relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl text-slate-600 hover:text-slate-300 hover:bg-white/5">
              <X size={16} />
            </button>

            {/* Big icon */}
            <div className="relative inline-flex mb-4">
              <div className="absolute inset-0 rounded-3xl animate-pulse opacity-20" style={{ background: badgeColor }} />
              <div
                className="relative h-24 w-24 rounded-3xl flex items-center justify-center text-5xl border-2"
                style={{
                  background: `radial-gradient(circle at 35% 35%, ${badgeColor}30, ${badgeColor}05)`,
                  borderColor: `${badgeColor}50`,
                  boxShadow: `0 0 40px ${badgeColor}40, inset 0 2px 0 ${badgeColor}20`,
                }}
              >
                {achievement.icon}
              </div>
              <div
                className="absolute -top-2 -right-2 h-8 w-8 rounded-full flex items-center justify-center border-2 text-sm"
                style={{ background: badgeColor, borderColor: "#0a0d14", color: "#0a0d14" }}
              >
                {r.icon}
              </div>
            </div>

            {/* Rarity pill */}
            <div className="flex justify-center mb-3">
              <span
                className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border"
                style={{ color: r.color, background: r.bg, borderColor: r.border }}
              >
                {r.label} Achievement
              </span>
            </div>

            <h2 className="text-2xl font-black text-white mb-2" style={{ textShadow: `0 0 30px ${badgeColor}40` }}>
              {achievement.title}
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">{achievement.description}</p>

            {achievement.unlockedAt && (
              <p className="text-xs mt-4 font-semibold" style={{ color: badgeColor }}>
                Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString("en-IN", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric"
                })}
              </p>
            )}
          </div>

          {/* Bottom bar */}
          <div
            className="h-1"
            style={{
              background: achievement.rarity === "mythic"
                ? `linear-gradient(90deg, #f472b6, #a855f7, #22d3ee, #f472b6)`
                : `linear-gradient(90deg, transparent, ${badgeColor}, transparent)`,
            }}
          />
        </div>
      </div>
    </>,
    document.body
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const FILTER_OPTIONS = ["All", "Unlocked", "Locked", ...RARITY_ORDER.map(r => RARITY_CONFIG[r].label)];
const CATEGORY_LABELS = {
  tasks: "Tasks", habit_streak: "Habits", projects: "Projects",
  learning: "Learning", journal: "Journal", knowledge: "Knowledge",
  budget: "Budget", ideas: "Ideas", first_login: "Getting Started",
};

function getCategory(key) {
  if (key.startsWith("tasks")) return "tasks";
  if (key.startsWith("habit")) return "habit_streak";
  if (key.startsWith("projects")) return "projects";
  if (key.startsWith("learning")) return "learning";
  if (key.startsWith("journal")) return "journal";
  if (key.startsWith("knowledge")) return "knowledge";
  if (key.startsWith("budget")) return "budget";
  if (key.startsWith("ideas")) return "ideas";
  return "other";
}

export default function AchievementsPage() {
  const { achievements, summary, loading, triggerEvaluation } = useAchievements();
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const pct = summary.total > 0 ? Math.round((summary.unlocked / summary.total) * 100) : 0;

  // Group by category
  const grouped = useMemo(() => {
    let list = [...achievements];

    // Apply filter
    if (filter === "Unlocked") list = list.filter(a => a.unlocked);
    else if (filter === "Locked") list = list.filter(a => !a.unlocked);
    else {
      const rarityMatch = RARITY_ORDER.find(r => RARITY_CONFIG[r].label === filter);
      if (rarityMatch) list = list.filter(a => a.rarity === rarityMatch);
    }

    // Apply search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
      );
    }

    // Group by category
    const groups = {};
    for (const a of list) {
      const cat = getCategory(a.key);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(a);
    }

    // Sort each group: unlocked first, then by rarity desc
    for (const cat of Object.keys(groups)) {
      groups[cat].sort((a, b) => {
        if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
        return RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
      });
    }

    return groups;
  }, [achievements, filter, search]);

  // Showcase: highest rarity unlocked
  const showcase = useMemo(() => {
    return [...achievements]
      .filter(a => a.unlocked)
      .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity))
      .slice(0, 4);
  }, [achievements]);

  if (loading) {
    return <PageWrapper className="flex items-center justify-center"><Spinner size="lg" /></PageWrapper>;
  }

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">

        {/* ── Header ── */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border border-yellow-500/20 flex items-center justify-center">
                <Trophy size={18} className="text-yellow-400" />
              </div>
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">Achievements</h1>
            </div>
            <p className="text-sm text-slate-500 pl-13">
              {summary.unlocked} of {summary.total} unlocked · {pct}% complete
            </p>
          </div>
          <button
            onClick={triggerEvaluation}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-3 text-slate-400 hover:text-slate-200 text-sm transition-colors hover:bg-surface-2 border border-surface-3"
          >
            <RefreshCw size={14} /> Check Progress
          </button>
        </div>

        {/* ── Overall progress bar ── */}
        <div
          className="rounded-2xl border p-5 relative overflow-hidden"
          style={{ background: "#0d1117", borderColor: "#1e2535" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-slate-200">Overall Progress</span>
            <span className="text-lg font-black" style={{
              background: "linear-gradient(90deg, #6366f1, #a855f7, #22d3ee)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>{pct}%</span>
          </div>
          <div className="h-3 bg-[#1e2535] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, #6366f1, #a855f7, #f472b6, #fb923c)",
                boxShadow: "0 0 12px rgba(168,85,247,0.5)",
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-600 mt-2">
            <span>{summary.unlocked} unlocked</span>
            <span>{summary.total - summary.unlocked} remaining</span>
          </div>

          {/* Rarity breakdown */}
          <div className="flex flex-wrap gap-2 mt-4">
            {RARITY_ORDER.map(rarity => {
              const count = achievements.filter(a => a.unlocked && a.rarity === rarity).length;
              const total = achievements.filter(a => a.rarity === rarity).length;
              const rc = RARITY_CONFIG[rarity];
              if (total === 0) return null;
              return (
                <div
                  key={rarity}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold"
                  style={{ color: rc.color, background: rc.bg, borderColor: rc.border }}
                >
                  {rc.icon}
                  <span>{rc.label}</span>
                  <span style={{ opacity: 0.7 }}>{count}/{total}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Showcase (top unlocked) ── */}
        {showcase.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">✦ Recent Unlocks</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {showcase.map(a => {
                const rc = RARITY_CONFIG[a.rarity] || RARITY_CONFIG.common;
                const bc = BADGE_COLORS[a.key] || rc.color;
                return (
                  <div
                    key={a._id}
                    onClick={() => setSelected(a)}
                    className="relative rounded-2xl border p-3 text-center cursor-pointer hover:scale-105 transition-all duration-200 overflow-hidden"
                    style={{
                      background: `radial-gradient(circle at 50% 0%, ${bc}12 0%, #0d1117 60%)`,
                      borderColor: `${bc}30`,
                      boxShadow: `0 0 24px ${rc.glow}`,
                    }}
                  >
                    <div className="text-3xl mb-1.5">{a.icon}</div>
                    <p className="text-xs font-bold text-slate-200 leading-tight">{a.title}</p>
                    <p className="text-[10px] mt-0.5 font-semibold" style={{ color: rc.color }}>{rc.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Filters + Search ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-[#0d1117] border border-[#1e2535] rounded-xl px-3 py-2">
            <Search size={14} className="text-slate-600 shrink-0" />
            <input
              type="text"
              placeholder="Search achievements…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-300 placeholder-slate-600 outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {["All", "Unlocked", "Locked"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  "text-xs px-3 py-1.5 rounded-full font-semibold transition-colors",
                  filter === f ? "bg-indigo-600 text-white" : "bg-[#1e2535] text-slate-500 hover:text-slate-300"
                )}
              >{f}</button>
            ))}
            <div className="w-px bg-[#1e2535] mx-1" />
            {RARITY_ORDER.map(r => {
              const rc = RARITY_CONFIG[r];
              const active = filter === rc.label;
              return (
                <button
                  key={r}
                  onClick={() => setFilter(active ? "All" : rc.label)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold transition-all border"
                  style={active ? {
                    background: rc.bg, color: rc.color, borderColor: rc.border,
                  } : {
                    background: "transparent", color: "#4b5563", borderColor: "#1e2535",
                  }}
                >
                  {rc.icon} {rc.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Grouped achievement grid ── */}
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-slate-500">No achievements match your filter.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, items]) => (
            <section key={cat}>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">
                {CATEGORY_LABELS[cat] || cat}
                <span className="ml-2 text-slate-700 normal-case font-normal tracking-normal">
                  {items.filter(a => a.unlocked).length}/{items.length}
                </span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {items.map(a => (
                  <AchievementCard key={a._id} achievement={a} onClick={setSelected} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Detail modal */}
      {selected && <DetailModal achievement={selected} onClose={() => setSelected(null)} />}
    </PageWrapper>
  );
}
