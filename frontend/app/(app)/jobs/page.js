"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus, Trash2, Edit2, ExternalLink, Briefcase,
  X, User, DollarSign, Calendar, Link2,
  MapPin, ChevronRight, TrendingUp, Target,
  CheckCircle2, XCircle, Clock, Send, Bookmark,
  ArrowRight, Sparkles, Building2, Search,
} from "lucide-react";
import { useJobs } from "@/hooks/useProjects";
import { Button, Spinner, Input, Select, Textarea } from "@/components/ui";
import Modal from "@/components/ui/Modal";
import PageWrapper from "@/components/layout/PageWrapper";
import { JOB_STAGES } from "@/lib/constants";
import clsx from "clsx";

// ── Stage design system ───────────────────────────────────────────────────────
const STAGE_META = {
  saved:     { icon: Bookmark,     color: "#64748b", bg: "rgba(100,116,139,0.1)",  border: "rgba(100,116,139,0.25)", text: "text-slate-400",   label: "Saved",     emoji: "🔖" },
  applied:   { icon: Send,         color: "#3b82f6", bg: "rgba(59,130,246,0.1)",   border: "rgba(59,130,246,0.25)",  text: "text-blue-400",    label: "Applied",   emoji: "📤" },
  interview: { icon: Clock,        color: "#a855f7", bg: "rgba(168,85,247,0.1)",   border: "rgba(168,85,247,0.25)",  text: "text-purple-400",  label: "Interview", emoji: "🎤" },
  offer:     { icon: CheckCircle2, color: "#10b981", bg: "rgba(16,185,129,0.1)",   border: "rgba(16,185,129,0.25)", text: "text-emerald-400", label: "Offer 🎉",  emoji: "🎉" },
  rejected:  { icon: XCircle,      color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)",    text: "text-red-400",     label: "Rejected",  emoji: "❌" },
};

// Generate a deterministic gradient from company name
function companyGradient(name = "") {
  const colors = [
    ["#6366f1","#8b5cf6"], ["#3b82f6","#06b6d4"], ["#10b981","#059669"],
    ["#f59e0b","#ef4444"], ["#ec4899","#8b5cf6"], ["#14b8a6","#3b82f6"],
    ["#f97316","#ef4444"], ["#a855f7","#ec4899"],
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

function CompanyAvatar({ name = "", size = "md" }) {
  const [c1, c2] = companyGradient(name);
  const letter = name.trim()[0]?.toUpperCase() || "?";
  const dim = size === "lg" ? "h-14 w-14 text-2xl" : size === "sm" ? "h-8 w-8 text-sm" : "h-10 w-10 text-base";
  return (
    <div
      className={clsx("rounded-xl flex items-center justify-center font-black text-white shrink-0", dim)}
      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})`, boxShadow: `0 4px 12px ${c1}40` }}
    >
      {letter}
    </div>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function StatsBar({ jobs }) {
  const stats = useMemo(() => {
    const total     = jobs.length;
    const applied   = jobs.filter(j => j.stage !== "saved").length;
    const interview = jobs.filter(j => j.stage === "interview").length;
    const offer     = jobs.filter(j => j.stage === "offer").length;
    const rejected  = jobs.filter(j => j.stage === "rejected").length;
    const rate      = applied > 0 ? Math.round((interview / applied) * 100) : 0;
    return { total, applied, interview, offer, rejected, rate };
  }, [jobs]);

  const items = [
    { label: "Total",      value: stats.total,     color: "#94a3b8", icon: Briefcase    },
    { label: "Applied",    value: stats.applied,   color: "#3b82f6", icon: Send         },
    { label: "Interviews", value: stats.interview, color: "#a855f7", icon: Clock        },
    { label: "Offers",     value: stats.offer,     color: "#10b981", icon: CheckCircle2 },
    { label: "Int. Rate",  value: `${stats.rate}%`, color: "#f59e0b", icon: TrendingUp   },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      {items.map(({ label, value, color, icon: Icon }) => (
        <div
          key={label}
          className="rounded-2xl border px-4 py-3 flex items-center gap-3"
          style={{ background: "#0d1117", borderColor: "#1e2535" }}
        >
          <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
            <Icon size={15} style={{ color }} />
          </div>
          <div>
            <p className="text-lg font-black text-slate-100 leading-none">{value}</p>
            <p className="text-[11px] text-slate-600 mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Job Card ──────────────────────────────────────────────────────────────────
function JobCard({ job, onView, onEdit, onDelete }) {
  const meta  = STAGE_META[job.stage] || STAGE_META.saved;
  const fmt   = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : null;
  const isOffer    = job.stage === "offer";
  const isRejected = job.stage === "rejected";

  return (
    <div
      onClick={() => onView(job)}
      className={clsx(
        "group relative rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200",
        "hover:scale-[1.02] hover:-translate-y-0.5",
        isOffer    && "ring-1 ring-emerald-500/30",
        isRejected && "opacity-60 hover:opacity-80",
      )}
      style={{
        background: isOffer
          ? "linear-gradient(135deg, #052e16 0%, #0d1117 100%)"
          : "#0d1117",
        borderColor: isOffer ? "#10b98130" : "#1e2535",
        boxShadow: isOffer
          ? "0 0 30px rgba(16,185,129,0.12), 0 4px 20px rgba(0,0,0,0.4)"
          : "0 2px 12px rgba(0,0,0,0.3)",
      }}
    >
      {/* Top shimmer for offer */}
      {isOffer && (
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, #10b981, transparent)" }} />
      )}

      {/* Action buttons */}
      <div
        className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={() => onEdit(job)}
          className="p-1.5 rounded-lg bg-[#1e2535] text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
          <Edit2 size={11} />
        </button>
        <button onClick={() => onDelete(job._id)}
          className="p-1.5 rounded-lg bg-[#1e2535] text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
          <Trash2 size={11} />
        </button>
      </div>

      <div className="p-3.5">
        {/* Company + role */}
        <div className="flex items-start gap-3 mb-3 pr-10">
          <CompanyAvatar name={job.company} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-100 text-sm leading-tight truncate">{job.role}</p>
            <p className="text-xs text-slate-500 truncate mt-0.5 flex items-center gap-1">
              <Building2 size={10} className="shrink-0" /> {job.company}
            </p>
          </div>
        </div>

        {/* Chips row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {job.salary && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#1e2535] text-slate-400">
              <DollarSign size={9} />{job.salary}
            </span>
          )}
          {job.contactPerson && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#1e2535] text-slate-400">
              <User size={9} />{job.contactPerson}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {job.followUpDate ? (
            <span className="text-[10px] text-amber-500/70 flex items-center gap-1">
              <Calendar size={9} />Follow-up {fmt(job.followUpDate)}
            </span>
          ) : job.appliedDate ? (
            <span className="text-[10px] text-slate-600 flex items-center gap-1">
              <Calendar size={9} />Applied {fmt(job.appliedDate)}
            </span>
          ) : <span />}

          {job.jobUrl && (
            <a href={job.jobUrl} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5 transition-colors">
              <ExternalLink size={9} />Link
            </a>
          )}
        </div>
      </div>

      {/* Bottom stage color strip */}
      <div className="h-0.5" style={{ background: meta.color + "60" }} />
    </div>
  );
}

// ── Kanban Column ─────────────────────────────────────────────────────────────
function KanbanColumn({ stage, jobs, onView, onEdit, onDelete, onAddClick }) {
  const meta   = STAGE_META[stage] || STAGE_META.saved;
  const StageIcon = meta.icon;
  const isOffer = stage === "offer";

  return (
    <div className="flex flex-col min-w-[220px] flex-1">
      {/* Column header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-3 border"
        style={{ background: meta.bg, borderColor: meta.border }}
      >
        <div className="flex items-center gap-2">
          <StageIcon size={13} style={{ color: meta.color }} />
          <span className="text-xs font-bold" style={{ color: meta.color }}>{meta.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {jobs.length > 0 && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: meta.color + "25", color: meta.color }}
            >
              {jobs.length}
            </span>
          )}
          {stage === "saved" && (
            <button onClick={onAddClick}
              className="h-5 w-5 rounded-md flex items-center justify-center transition-colors hover:opacity-80"
              style={{ background: meta.color + "30", color: meta.color }}>
              <Plus size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Cards */}
      <div
        className="flex-1 space-y-2.5 rounded-2xl p-2 min-h-[300px] border transition-colors"
        style={{
          background: isOffer ? "rgba(16,185,129,0.03)" : "rgba(13,17,23,0.6)",
          borderColor: isOffer ? "rgba(16,185,129,0.1)" : "#1e2535",
          borderStyle: "dashed",
        }}
      >
        {jobs.map(j => (
          <JobCard key={j._id} job={j} onView={onView} onEdit={onEdit} onDelete={onDelete} />
        ))}
        {jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-24 text-center">
            <p className="text-[11px] text-slate-700">Empty</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Job Detail Drawer ─────────────────────────────────────────────────────────
function JobDrawer({ job, onClose, onEdit, onDelete, onStageChange }) {
  const [moving, setMoving] = useState(false);
  if (!job) return null;

  const meta   = STAGE_META[job.stage] || STAGE_META.saved;
  const StageIcon = meta.icon;
  const fmt    = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null;

  const handleMove = async (newStage) => {
    setMoving(true);
    try { await onStageChange(job._id, newStage); }
    finally { setMoving(false); }
  };

  const handleDelete = async () => {
    if (!confirm("Remove this application?")) return;
    onClose();
    await onDelete(job._id);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed right-0 top-0 h-full z-50 w-full max-w-md flex flex-col overflow-hidden border-l"
        style={{ background: "#080b11", borderColor: "#1e2535" }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b" style={{ borderColor: "#1e2535" }}>
          <div className="flex items-start gap-4">
            <CompanyAvatar name={job.company} size="lg" />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black text-slate-100 leading-tight">{job.role}</h2>
              <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                <Building2 size={13} /> {job.company}
              </p>
              {/* Stage badge */}
              <div className="flex items-center gap-2 mt-3">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border"
                  style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}
                >
                  <StageIcon size={11} /> {meta.label}
                </span>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => { onClose(); setTimeout(() => onEdit(job), 100); }}
                className="p-2 rounded-xl text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                <Edit2 size={14} />
              </button>
              <button onClick={handleDelete}
                className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                <Trash2 size={14} />
              </button>
              <button onClick={onClose}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Quick info grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: DollarSign, label: "Salary",       value: job.salary },
              { icon: User,       label: "Contact",      value: job.contactPerson },
              { icon: Calendar,   label: "Applied",      value: fmt(job.appliedDate) },
              { icon: Calendar,   label: "Follow-up",    value: fmt(job.followUpDate) },
            ].map(({ icon: Icon, label, value }) => value ? (
              <div key={label}
                className="rounded-xl border px-3 py-2.5"
                style={{ background: "#0d1117", borderColor: "#1e2535" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-1">{label}</p>
                <p className="text-sm text-slate-300 font-medium flex items-center gap-1.5">
                  <Icon size={12} className="text-slate-600 shrink-0" /> {value}
                </p>
              </div>
            ) : null)}
          </div>

          {/* Job URL */}
          {job.jobUrl && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Job Posting</p>
              <a href={job.jobUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors p-3 rounded-xl border hover:border-blue-500/30 group"
                style={{ background: "#0d1117", borderColor: "#1e2535" }}>
                <Link2 size={13} className="shrink-0" />
                <span className="truncate flex-1">{job.jobUrl}</span>
                <ExternalLink size={12} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          )}

          {/* Notes */}
          {job.notes && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Notes</p>
              <div className="rounded-xl border p-4" style={{ background: "#0d1117", borderColor: "#1e2535" }}>
                <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{job.notes}</p>
              </div>
            </div>
          )}

          {/* Pipeline progress */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Pipeline Stage</p>
            <div className="space-y-1.5">
              {JOB_STAGES.map((s, idx) => {
                const sm = STAGE_META[s.value];
                const SIcon = sm.icon;
                const isActive = s.value === job.stage;
                const currentIdx = JOB_STAGES.findIndex(x => x.value === job.stage);
                const isPast = idx < currentIdx;
                const isNext = idx === currentIdx + 1;

                return (
                  <button key={s.value}
                    onClick={() => !isActive && !moving && handleMove(s.value)}
                    disabled={isActive || moving}
                    className={clsx(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-all border",
                      isActive   && "cursor-default",
                      !isActive  && !isPast && "hover:border-opacity-50 cursor-pointer",
                      isPast     && "opacity-40 cursor-pointer hover:opacity-60",
                      moving     && "pointer-events-none opacity-50",
                    )}
                    style={isActive ? {
                      background: sm.bg, borderColor: sm.border, color: sm.color,
                    } : {
                      background: "transparent", borderColor: "#1e2535", color: "#64748b",
                    }}
                  >
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                      style={isActive ? { background: sm.color + "20", border: `1px solid ${sm.color}40` } : { background: "#1e2535" }}>
                      <SIcon size={13} style={{ color: isActive ? sm.color : "#4b5563" }} />
                    </div>
                    <span className={clsx("flex-1 font-medium", isPast && "line-through")}>
                      {sm.label}
                    </span>
                    {isActive && <span className="text-[10px] font-bold opacity-70">CURRENT</span>}
                    {isNext && !isActive && (
                      <ArrowRight size={13} className="opacity-40" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meta */}
          <div className="border-t pt-4 text-xs text-slate-700 space-y-1" style={{ borderColor: "#1e2535" }}>
            <p>Added {fmt(job.createdAt)}</p>
            <p>Updated {fmt(job.updatedAt)}</p>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────────
function JobModal({ open, onClose, onSave, initial }) {
  const blank = { company: "", role: "", stage: "saved", notes: "", contactPerson: "", salary: "", jobUrl: "", followUpDate: "", appliedDate: "" };
  const [form, setForm]     = useState(blank);
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => { if (open) setForm(initial || blank); }, [open, initial]);

  const handleSave = async () => {
    if (!form.company || !form.role) return;
    try { setSaving(true); await onSave(form); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Application" : "Add Application"} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Company *" value={form.company} onChange={set("company")} placeholder="Google" />
          <Input label="Role *" value={form.role} onChange={set("role")} placeholder="Senior Engineer" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Stage" value={form.stage} onChange={set("stage")}>
            {JOB_STAGES.map(s => <option key={s.value} value={s.value}>{STAGE_META[s.value]?.label || s.label}</option>)}
          </Select>
          <Input label="Salary Range" value={form.salary} onChange={set("salary")} placeholder="₹12–18 LPA" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Contact Person" value={form.contactPerson} onChange={set("contactPerson")} placeholder="Recruiter name" />
          <Input label="Job URL" value={form.jobUrl} onChange={set("jobUrl")} placeholder="https://…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Applied Date" type="date" value={form.appliedDate || ""} onChange={set("appliedDate")} />
          <Input label="Follow-up Date" type="date" value={form.followUpDate || ""} onChange={set("followUpDate")} />
        </div>
        <Textarea label="Notes" value={form.notes} onChange={set("notes")} rows={3} placeholder="Interview notes, company research, gut feeling…" />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={!form.company || !form.role || saving}>
            {saving ? "Saving…" : initial ? "Save Changes" : "Add Application"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function JobsPage() {
  const [modalOpen, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [search, setSearch]   = useState("");

  const { jobs, loading, createJob, updateJob, patchStage, deleteJob } = useJobs();

  const normalise = j => j
    ? { ...j, appliedDate: j.appliedDate?.slice(0, 10) || "", followUpDate: j.followUpDate?.slice(0, 10) || "" }
    : null;

  const openEdit   = j => { setEditing(normalise(j)); setModal(true); };
  const openCreate = () => { setEditing(null); setModal(true); };
  const openView   = j => setViewing(j);

  useEffect(() => {
    if (!viewing) return;
    const fresh = jobs.find(j => j._id === viewing._id);
    if (fresh) setViewing(fresh);
  }, [jobs]);

  const handleSave = async payload => {
    if (editing) await updateJob(editing._id, payload);
    else         await createJob(payload);
  };

  const handleDelete = async id => {
    if (!confirm("Remove this application?")) return;
    if (viewing?._id === id) setViewing(null);
    await deleteJob(id);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return jobs;
    const q = search.toLowerCase();
    return jobs.filter(j =>
      j.company.toLowerCase().includes(q) || j.role.toLowerCase().includes(q)
    );
  }, [jobs, search]);

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/10 border border-blue-500/20 flex items-center justify-center">
              <Briefcase size={17} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-100 tracking-tight">Job Pipeline</h1>
              <p className="text-xs text-slate-600 mt-0.5">
                {jobs.length} application{jobs.length !== 1 ? "s" : ""} tracked
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {jobs.length > 0 && (
              <div className="flex items-center gap-2 bg-[#0d1117] border border-[#1e2535] rounded-xl px-3 py-2 w-44">
                <Search size={13} className="text-slate-600 shrink-0" />
                <input
                  type="text"
                  placeholder="Search…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-slate-300 placeholder-slate-700 outline-none"
                />
              </div>
            )}
            <Button variant="primary" onClick={openCreate}>
              <Plus size={15} /> Add Application
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : jobs.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="relative mb-6">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-blue-600/20 to-purple-600/10 border border-blue-500/20 flex items-center justify-center mx-auto">
                <Briefcase size={32} className="text-blue-400" />
              </div>
              <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-indigo-600 flex items-center justify-center border-2 border-[#080b11]">
                <Sparkles size={13} className="text-white" />
              </div>
            </div>
            <h3 className="text-lg font-black text-slate-200 mb-2">Your pipeline is empty</h3>
            <p className="text-sm text-slate-600 mb-6 max-w-xs">
              Start tracking your job applications. Know exactly where you stand at every stage.
            </p>
            <Button variant="primary" onClick={openCreate}>
              <Plus size={15} /> Add First Application
            </Button>
          </div>
        ) : (
          <>
            {/* ── Stats ── */}
            <StatsBar jobs={jobs} />

            {/* ── Kanban board ── */}
            <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "thin" }}>
              {JOB_STAGES.map(({ value }) => (
                <KanbanColumn
                  key={value}
                  stage={value}
                  jobs={filtered.filter(j => j.stage === value)}
                  onView={openView}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onAddClick={openCreate}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Drawer */}
      {viewing && (
        <JobDrawer
          job={viewing}
          onClose={() => setViewing(null)}
          onEdit={openEdit}
          onDelete={handleDelete}
          onStageChange={patchStage}
        />
      )}

      {/* Modal */}
      <JobModal
        open={modalOpen}
        onClose={() => setModal(false)}
        onSave={handleSave}
        initial={editing}
      />
    </PageWrapper>
  );
}
