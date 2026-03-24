"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import {
  ArrowRight, CheckCircle, Zap, Folder,
  Briefcase, GraduationCap, Activity, Wallet,
  TrendingUp, TrendingDown, Sparkles, Target,
  BarChart3, Clock, AlertCircle, Trophy,
} from "lucide-react";
import { ProgressBar, Badge } from "@/components/ui";
import { TASK_PRIORITIES, ACTIVITY_META } from "@/lib/constants";
import clsx from "clsx";

// ─── Daily Quote hook ───────────────────────────────────────────────────────
function useDailyQuote(name) {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const today = new Date().toDateString();
    const cacheKey = `daily_quote_${today}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) { setQuote(JSON.parse(cached)); setLoading(false); return; }
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    const dayOfWeek = format(new Date(), "EEEE");
    fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 120,
        messages: [{ role: "user", content: `Generate a short, punchy motivational quote for a developer/student named ${name} on a ${dayOfWeek} ${timeOfDay}. Return ONLY a JSON object like: {"quote": "...", "author": "...", "vibe": "energetic|calm|focused|ambitious"}. Make the quote feel fresh, not cliché. Max 20 words. Real author or "Anonymous". No preamble, just the JSON.` }],
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        const text = data.content?.[0]?.text || "";
        const clean = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        sessionStorage.setItem(cacheKey, JSON.stringify(parsed));
        setQuote(parsed);
      })
      .catch(() => {
        const fallbacks = [
          { quote: "Build things that matter. Ship things that work.", author: "Anonymous", vibe: "focused" },
          { quote: "Every expert was once a beginner who refused to quit.", author: "Anonymous", vibe: "ambitious" },
          { quote: "The best time to start was yesterday. The second best is now.", author: "Anonymous", vibe: "energetic" },
          { quote: "Code is poetry written in logic.", author: "Anonymous", vibe: "calm" },
        ];
        const fallback = fallbacks[new Date().getDay() % fallbacks.length];
        sessionStorage.setItem(cacheKey, JSON.stringify(fallback));
        setQuote(fallback);
      })
      .finally(() => setLoading(false));
  }, [name]);
  return { quote, loading };
}

// ─── Live Clock ─────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(format(new Date(), "HH:mm:ss"));
  useEffect(() => {
    const id = setInterval(() => setTime(format(new Date(), "HH:mm:ss")), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono tabular-nums">{time}</span>;
}

// ─── Vibe configs for hero ───────────────────────────────────────────────────
const VIBE_CONFIG = {
  energetic: { primary: "#f97316", secondary: "#fb923c", glow: "rgba(249,115,22,0.18)", label: "ENERGIZED", mesh: "radial-gradient(ellipse at 20% 50%, rgba(249,115,22,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(251,146,60,0.1) 0%, transparent 50%)" },
  calm:      { primary: "#38bdf8", secondary: "#7dd3fc", glow: "rgba(56,189,248,0.15)",  label: "CALM",      mesh: "radial-gradient(ellipse at 30% 60%, rgba(56,189,248,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(125,211,252,0.08) 0%, transparent 50%)" },
  focused:   { primary: "#a3e635", secondary: "#bef264", glow: "rgba(163,230,53,0.15)",  label: "IN THE ZONE", mesh: "radial-gradient(ellipse at 10% 80%, rgba(163,230,53,0.12) 0%, transparent 60%), radial-gradient(ellipse at 90% 20%, rgba(190,242,100,0.08) 0%, transparent 50%)" },
  ambitious: { primary: "#c084fc", secondary: "#e879f9", glow: "rgba(192,132,252,0.18)", label: "AMBITIOUS", mesh: "radial-gradient(ellipse at 60% 80%, rgba(192,132,252,0.15) 0%, transparent 60%), radial-gradient(ellipse at 20% 10%, rgba(232,121,249,0.1) 0%, transparent 50%)" },
};

// ─── Greeting Card ───────────────────────────────────────────────────────────
export function GreetingCard({ name }) {
  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Still up?" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = name?.split(" ")[0] || name;
  const { quote, loading } = useDailyQuote(name);
  const vibe = quote?.vibe || "calm";
  const cfg = VIBE_CONFIG[vibe] || VIBE_CONFIG.calm;

  return (
    <div className="col-span-full relative overflow-hidden rounded-2xl" style={{ background: "#0d1117", border: `1px solid ${cfg.primary}22`, minHeight: "176px" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: cfg.mesh }} />
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-[70px] pointer-events-none" style={{ background: cfg.glow }} />
      <div className="relative z-10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-[0.15em] mb-3" style={{ background: `${cfg.primary}18`, color: cfg.primary, border: `1px solid ${cfg.primary}30` }}>
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: cfg.primary }} />
            {cfg.label}
          </div>
          <p className="text-slate-400 text-sm tracking-wide">{greeting},</p>
          <h2 className="text-4xl font-black tracking-tight mt-1" style={{ color: "#ffffff" }}>
            {firstName} 👋
          </h2>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><Clock size={11} /><LiveClock /></span>
            <span className="h-3 w-px bg-slate-800" />
            <span className="text-xs text-slate-500">{format(new Date(), "EEEE, MMMM do yyyy")}</span>
            <span className="hidden sm:block h-3 w-px bg-slate-800" />
            <span className="hidden sm:block text-xs text-slate-700">W{format(new Date(), "ww")}</span>
          </div>
        </div>
        <div className="sm:max-w-xs w-full rounded-xl px-4 py-3.5 flex-shrink-0" style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)", border: `1px solid ${cfg.primary}20` }}>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-3 bg-slate-800 rounded w-full" />
              <div className="h-3 bg-slate-800 rounded w-4/5" />
              <div className="h-2.5 bg-slate-800/60 rounded w-2/5 mt-2" />
            </div>
          ) : quote ? (
            <>
              <Sparkles size={12} className="mb-2" style={{ color: cfg.primary }} />
              <p className="text-sm text-slate-300 leading-relaxed italic">"{quote.quote}"</p>
              <p className="text-xs mt-2" style={{ color: `${cfg.primary}80` }}>— {quote.author}</p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Widget shell with hover glow ───────────────────────────────────────────
function Widget({ children, className, accent = "#6366f1" }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={clsx("relative rounded-2xl overflow-hidden flex flex-col transition-all duration-300", className)}
      style={{
        background: "linear-gradient(145deg, #161b27 0%, #111520 100%)",
        border: `1px solid ${hovered ? accent + "38" : "#ffffff0d"}`,
        boxShadow: hovered ? `0 0 28px ${accent}15, 0 4px 20px rgba(0,0,0,0.4)` : "0 2px 10px rgba(0,0,0,0.3)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="absolute top-0 left-0 right-0 h-px transition-opacity duration-300" style={{ background: `linear-gradient(90deg, transparent, ${accent}55, transparent)`, opacity: hovered ? 1 : 0.25 }} />
      {children}
    </div>
  );
}

// ─── Widget header ───────────────────────────────────────────────────────────
function WHeader({ icon: Icon, color, label, href }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}25` }}>
          <Icon size={13} style={{ color }} />
        </div>
        <span className="text-[11px] font-bold text-slate-400 tracking-[0.1em] uppercase">{label}</span>
      </div>
      <Link href={href} className="group flex items-center gap-1 text-[10px] font-medium text-slate-700 hover:text-slate-300 transition-colors">
        All <ArrowRight size={9} className="group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptySlate({ emoji, text }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-8 gap-2">
      <span className="text-3xl opacity-20">{emoji}</span>
      <p className="text-xs text-slate-700 text-center">{text}</p>
    </div>
  );
}

// ─── Focus Tasks ─────────────────────────────────────────────────────────────
export function FocusTasksWidget({ tasks = [] }) {
  return (
    <Widget accent="#34d399">
      <div className="p-5 flex flex-col h-full">
        <WHeader icon={Target} color="#34d399" label="Focus Tasks" href="/tasks" />
        {tasks.length === 0 ? <EmptySlate emoji="🎉" text="You're all clear!" /> : (
          <ul className="space-y-1.5 flex-1">
            {tasks.map((task) => {
              const pri = TASK_PRIORITIES.find((p) => p.value === task.priority);
              const isUrgent = task.priority === "urgent";
              return (
                <li key={task._id} className="group flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 hover:bg-white/[0.04]">
                  <div className="mt-1.5 shrink-0 relative">
                    {isUrgent ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-60" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
                      </>
                    ) : (
                      <div className={clsx("h-2 w-2 rounded-full", pri?.dot || "bg-slate-600")} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 truncate group-hover:text-white transition-colors">{task.title}</p>
                    {task.dueDate && <p className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1"><Clock size={9} />{format(new Date(task.dueDate), "MMM d")}</p>}
                  </div>
                  {pri && <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-md shrink-0" style={{ background: `${isUrgent ? "#ef4444" : "#6366f1"}18`, color: isUrgent ? "#f87171" : "#818cf8" }}>{pri.label.toUpperCase()}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Widget>
  );
}

// ─── Habit Streaks ───────────────────────────────────────────────────────────
export function HabitStreakWidget({ habits = [] }) {
  const todayDone = habits.filter((h) => h.completedToday).length;
  const total = habits.length;
  const pct = total > 0 ? Math.round((todayDone / total) * 100) : 0;
  return (
    <Widget accent="#fbbf24">
      <div className="p-5 flex flex-col h-full">
        <WHeader icon={Zap} color="#fbbf24" label="Habit Streaks" href="/habits" />
        {total > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500">{todayDone}/{total} today</span>
              <span className="text-xs font-black" style={{ color: pct === 100 ? "#34d399" : "#fbbf24" }}>{pct}%</span>
            </div>
            <div className="flex gap-1">
              {habits.map((h) => <div key={h._id} className="h-1 flex-1 rounded-full transition-all duration-500" style={{ background: h.completedToday ? "#fbbf24" : "rgba(255,255,255,0.06)" }} />)}
            </div>
          </div>
        )}
        {habits.length === 0 ? <EmptySlate emoji="⚡" text="No habits yet" /> : (
          <ul className="space-y-1.5 flex-1">
            {habits.map((habit) => (
              <li key={habit._id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-colors">
                <span className="text-base w-5 text-center leading-none">{habit.icon || "⚡"}</span>
                <p className="text-sm text-slate-300 flex-1 truncate">{habit.title}</p>
                <div className="flex items-center gap-2 shrink-0">
                  {habit.completedToday && <div className="h-4 w-4 rounded-full bg-emerald-400/15 flex items-center justify-center"><CheckCircle size={9} className="text-emerald-400" /></div>}
                  <span className="text-xs font-black tabular-nums" style={{ color: "#fbbf24" }}>{habit.currentStreak}🔥</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Widget>
  );
}

// ─── Task Stats (animated donut) ─────────────────────────────────────────────
export function TaskStatsWidget({ stats = {} }) {
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  const done = stats["done"] || 0;
  const inProgress = stats["in-progress"] || 0;
  const todo = stats["todo"] || 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const C = 2 * Math.PI * 36;
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 300); return () => clearTimeout(t); }, []);

  return (
    <Widget accent="#60a5fa">
      <div className="p-5 flex flex-col h-full">
        <WHeader icon={BarChart3} color="#60a5fa" label="Task Overview" href="/tasks" />
        <div className="flex items-center gap-5 mb-2">
          <div className="relative shrink-0">
            <svg width="90" height="90" viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
              <circle cx="44" cy="44" r="36" fill="none" stroke="#34d399" strokeWidth="7" strokeLinecap="round"
                strokeDasharray={`${animated ? (done / Math.max(total,1)) * C : 0} ${C}`}
                style={{ transition: "stroke-dasharray 1s cubic-bezier(.4,0,.2,1)", transform: "rotate(-90deg)", transformOrigin: "44px 44px" }} />
              <circle cx="44" cy="44" r="36" fill="none" stroke="#60a5fa" strokeWidth="7" strokeLinecap="round"
                strokeDasharray={`${animated ? (inProgress / Math.max(total,1)) * C : 0} ${C}`}
                strokeDashoffset={-((done / Math.max(total,1)) * C)}
                style={{ transition: "stroke-dasharray 1s cubic-bezier(.4,0,.2,1) .1s", transform: "rotate(-90deg)", transformOrigin: "44px 44px" }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-white">{pct}%</span>
              <span className="text-[9px] text-slate-600 uppercase tracking-wider">done</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 flex-1">
            {[
              { label: "Done", value: done, color: "#34d399", bg: "rgba(52,211,153,0.1)" },
              { label: "Active", value: inProgress, color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
              { label: "Todo", value: todo, color: "#94a3b8", bg: "rgba(148,163,184,0.08)" },
              { label: "Total", value: total, color: "#e2e8f0", bg: "rgba(226,232,240,0.05)" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="rounded-xl px-3 py-2.5 flex flex-col" style={{ background: bg }}>
                <span className="text-[10px] text-slate-600 uppercase tracking-wider">{label}</span>
                <span className="text-lg font-black tabular-nums mt-0.5" style={{ color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Widget>
  );
}

// ─── Project Progress ────────────────────────────────────────────────────────
export function ProjectProgressWidget({ projects = [] }) {
  return (
    <Widget accent="#a78bfa">
      <div className="p-5 flex flex-col h-full">
        <WHeader icon={Folder} color="#a78bfa" label="Active Projects" href="/projects" />
        {projects.length === 0 ? <EmptySlate emoji="📁" text="No active projects" /> : (
          <ul className="space-y-4 flex-1">
            {projects.map((p) => {
              const c = p.color || "#a78bfa";
              return (
                <li key={p._id} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-5 w-5 rounded-md flex items-center justify-center shrink-0" style={{ background: `${c}20` }}>
                        <Folder size={10} style={{ color: c }} />
                      </div>
                      <p className="text-sm text-slate-300 truncate group-hover:text-white transition-colors">{p.title}</p>
                    </div>
                    <span className="text-xs font-black ml-2 shrink-0 tabular-nums" style={{ color: c }}>{p.progress}%</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p.progress}%`, background: `linear-gradient(90deg, ${c}70, ${c})` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Widget>
  );
}

// ─── Job Pipeline ────────────────────────────────────────────────────────────
const PIPELINE_STAGES = [
  { key: "saved",     label: "Saved",     color: "#94a3b8" },
  { key: "applied",   label: "Applied",   color: "#60a5fa" },
  { key: "interview", label: "Interview", color: "#c084fc" },
  { key: "offer",     label: "Offer",     color: "#34d399" },
  { key: "rejected",  label: "Rejected",  color: "#f87171" },
];
export function JobPipelineWidget({ pipeline = {} }) {
  const total = Object.values(pipeline).reduce((a, b) => a + b, 0);
  const max = Math.max(...Object.values(pipeline), 1);
  return (
    <Widget accent="#22d3ee">
      <div className="p-5 flex flex-col h-full">
        <WHeader icon={Briefcase} color="#22d3ee" label="Job Pipeline" href="/jobs" />
        {total === 0 ? <EmptySlate emoji="💼" text="No applications yet" /> : (
          <div className="flex-1 space-y-3">
            {PIPELINE_STAGES.map(({ key, label, color }) => {
              const count = pipeline[key] || 0;
              const pct = Math.round((count / max) * 100);
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-[11px] w-14 shrink-0 font-medium" style={{ color }}>{label}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}50, ${color})` }} />
                  </div>
                  <span className="text-xs font-black w-4 text-right shrink-0 tabular-nums" style={{ color }}>{count}</span>
                </div>
              );
            })}
            <p className="text-[11px] text-slate-700 pt-2 border-t border-white/[0.04]">{total} total applications</p>
          </div>
        )}
      </div>
    </Widget>
  );
}

// ─── Learning ────────────────────────────────────────────────────────────────
export function LearningWidget({ items = [] }) {
  return (
    <Widget accent="#818cf8">
      <div className="p-5 flex flex-col h-full">
        <WHeader icon={GraduationCap} color="#818cf8" label="Learning" href="/learning" />
        {items.length === 0 ? <EmptySlate emoji="📚" text="Nothing in progress" /> : (
          <ul className="space-y-4 flex-1">
            {items.map((item) => (
              <li key={item._id}>
                <div className="flex justify-between items-end mb-1.5">
                  <p className="text-sm text-slate-300 truncate flex-1 mr-2">{item.title}</p>
                  <span className="text-xs font-black shrink-0 tabular-nums" style={{ color: "#818cf8" }}>{item.progress}%</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.progress}%`, background: "linear-gradient(90deg, #6366f175, #818cf8)" }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Widget>
  );
}

// ─── Activity Feed ───────────────────────────────────────────────────────────
export function ActivityFeedWidget({ activities = [] }) {
  return (
    <Widget accent="#f472b6">
      <div className="p-5 flex flex-col h-full">
        <WHeader icon={Activity} color="#f472b6" label="Recent Activity" href="/activity" />
        {activities.length === 0 ? <EmptySlate emoji="📋" text="No activity yet" /> : (
          <div className="relative flex-1">
            <div className="absolute left-[7px] top-1 bottom-1 w-px" style={{ background: "linear-gradient(to bottom, #f472b625, transparent)" }} />
            <ul className="space-y-3.5 pl-5">
              {activities.map((a) => {
                const meta = ACTIVITY_META[a.type];
                return (
                  <li key={a._id} className="relative group">
                    <div className="absolute -left-5 top-1 h-3 w-3 rounded-full border-2" style={{ background: meta?.hex || "#475569", borderColor: "#111520", boxShadow: `0 0 6px ${meta?.hex || "#47556960"}` }} />
                    <p className="text-xs text-slate-300 leading-snug group-hover:text-white transition-colors">{a.entityTitle}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">{meta?.label} · {format(new Date(a.createdAt), "MMM d, h:mm a")}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </Widget>
  );
}

// ─── Budget ──────────────────────────────────────────────────────────────────
export function BudgetWidget({ budget = {} }) {
  const { income = 0, expense = 0, balance = 0 } = budget;
  const isPositive = balance >= 0;
  const spendPct = income > 0 ? Math.min(100, Math.round((expense / income) * 100)) : 0;
  const barColor = spendPct > 90 ? "#f87171" : spendPct > 70 ? "#fbbf24" : "#34d399";
  const ac = isPositive ? "#34d399" : "#f87171";
  return (
    <Widget accent={ac}>
      <div className="p-5 flex flex-col h-full">
        <WHeader icon={Wallet} color={ac} label="Budget" href="/budget" />
        {income === 0 && expense === 0 ? <EmptySlate emoji="💰" text="No entries this month" /> : (
          <>
            <div className="rounded-xl px-4 py-3.5 mb-4 relative overflow-hidden" style={{ background: `${ac}0d`, border: `1px solid ${ac}20` }}>
              <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full blur-2xl pointer-events-none" style={{ background: `${ac}25` }} />
              <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Monthly Balance</p>
              <p className="text-3xl font-black tracking-tight" style={{ color: ac }}>{isPositive ? "+" : "−"}₹{Math.abs(balance).toLocaleString("en-IN")}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { Icon: TrendingUp, label: "Income", value: income, color: "#34d399" },
                { Icon: TrendingDown, label: "Spent", value: expense, color: "#f87171" },
              ].map(({ Icon, label, value, color }) => (
                <div key={label} className="rounded-xl p-3 flex items-center gap-2.5" style={{ background: `${color}0d`, border: `1px solid ${color}15` }}>
                  <Icon size={13} style={{ color }} />
                  <div>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-black tabular-nums" style={{ color }}>₹{value.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              ))}
            </div>
            {income > 0 && (
              <>
                <div className="flex justify-between text-[11px] text-slate-600 mb-1.5">
                  <span>Spending rate</span>
                  <span className="font-bold" style={{ color: barColor }}>{spendPct}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${spendPct}%`, background: `linear-gradient(90deg, ${barColor}70, ${barColor})` }} />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Widget>
  );
}

// ─── Achievements ────────────────────────────────────────────────────────────
export function AchievementsWidget({ achievements = [], summary = {} }) {
  const unlocked = achievements.filter((a) => a.unlocked).slice(0, 9);
  const pct = summary.total > 0 ? Math.round((summary.unlocked / summary.total) * 100) : 0;
  return (
    <Widget accent="#fbbf24">
      <div className="p-5 flex flex-col h-full">
        <WHeader icon={Trophy} color="#fbbf24" label="Achievements" href="/achievements" />
        <div className="mb-4">
          <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1.5">
            <span>{summary.unlocked || 0} of {summary.total || 0} unlocked</span>
            <span className="font-black" style={{ color: "#fbbf24" }}>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #f59e0b, #fbbf24, #fde68a)" }} />
          </div>
        </div>
        {unlocked.length === 0 ? (
          <p className="text-xs text-slate-600 text-center py-4">Complete habits & tasks to unlock achievements</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {unlocked.map((a) => (
              <div key={a._id} title={`${a.title} — ${a.description}`} className="h-9 w-9 rounded-xl flex items-center justify-center text-lg cursor-default transition-all duration-150 hover:scale-110" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
                {a.icon}
              </div>
            ))}
          </div>
        )}
      </div>
    </Widget>
  );
}
