"use client";

import { useState, useEffect, useCallback, useRef, memo } from "react";
import {
  Plus, Trash2, Edit2, ExternalLink, CheckCircle, Circle,
  FolderOpen, X, GitBranch, Target, ChevronRight,
  Calendar, BarChart3, Globe, Loader2, Pin, PinOff,
  GripVertical, ChevronDown, ChevronUp, Clock, AlertCircle,
} from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { Button, Badge, ProgressBar, Spinner, EmptyState, Input, Select, Textarea } from "@/components/ui";
import Modal from "@/components/ui/Modal";
import PageWrapper from "@/components/layout/PageWrapper";
import { PROJECT_STATUSES, PROJECT_COLORS, PROJECT_CATEGORIES } from "@/lib/constants";
import api from "@/lib/api";
import clsx from "clsx";
import NooriCard, { NooriDrawer } from "@/components/projects/NooriCard";
import NooriEditModal from "@/components/projects/NooriEditModal";

const statusMeta = (value) => PROJECT_STATUSES.find((s) => s.value === value);

const PRIORITY_META = {
  urgent: { label: "Urgent", color: "text-red-400" },
  high:   { label: "High",   color: "text-orange-400" },
  medium: { label: "Medium", color: "text-amber-400" },
  low:    { label: "Low",    color: "text-slate-500" },
};

const TASK_STATUS_META = {
  "todo":        { label: "To Do",       color: "bg-slate-500/20 text-slate-400" },
  "in-progress": { label: "In Progress", color: "bg-blue-500/20 text-blue-400" },
  "review":      { label: "Review",      color: "bg-amber-500/20 text-amber-400" },
  "done":        { label: "Done",        color: "bg-emerald-500/20 text-emerald-400" },
};

// ── Project Modal ─────────────────────────────────────────────────────────────
function ProjectModal({ open, onClose, onSave, initial }) {
  const blank = {
    title: "", description: "", status: "active",
    repoLink: "", liveUrl: "", notes: "", color: PROJECT_COLORS[0], milestones: [],
    categories: [],
  };
  const [form, setForm]     = useState(blank);
  const [msInput, setMs]    = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) setForm(initial || blank); }, [open, initial]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const addMs = () => {
    if (!msInput.trim()) return;
    setForm((f) => ({ ...f, milestones: [...f.milestones, { title: msInput.trim(), done: false }] }));
    setMs("");
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    try { setSaving(true); await onSave(form); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Project" : "New Project"} size="lg">
      <div className="space-y-4">
        <Input label="Title *" value={form.title} onChange={set("title")} placeholder="Project name" />
        <Textarea label="Description" value={form.description} onChange={set("description")} rows={3} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Status" value={form.status} onChange={set("status")}>
            {PROJECT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <Input label="Repo / GitHub URL" value={form.repoLink} onChange={set("repoLink")} placeholder="https://github.com/…" />
        </div>
        <Input label="Live / Deployed URL" value={form.liveUrl || ""} onChange={set("liveUrl")} placeholder="https://yoursite.com" />

        <div>
          <p className="text-xs font-medium text-slate-400 mb-2">Colour</p>
          <div className="flex gap-2 flex-wrap">
            {PROJECT_COLORS.map((c) => (
              <button key={c} onClick={() => setForm((f) => ({ ...f, color: c }))}
                className={clsx("h-6 w-6 rounded-full border-2 transition-all",
                  form.color === c ? "border-white scale-110" : "border-transparent")}
                style={{ background: c }} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-400 mb-2">Categories <span className="text-slate-600">(pick one or more)</span></p>
          <div className="flex gap-2 flex-wrap">
            {PROJECT_CATEGORIES.map((cat) => {
              const selected = form.categories?.includes(cat.value);
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm((f) => ({
                    ...f,
                    categories: selected
                      ? f.categories.filter((c) => c !== cat.value)
                      : [...(f.categories || []), cat.value],
                  }))}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    selected
                      ? `${cat.color} border-current`
                      : "bg-surface-2 text-slate-500 border-white/10 hover:border-white/20"
                  )}
                >
                  <span>{cat.icon}</span>{cat.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-400 mb-2">Milestones</p>
          <div className="flex gap-2 mb-2">
            <input className="input-base flex-1 text-sm" placeholder="Add milestone…"
              value={msInput} onChange={(e) => setMs(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMs())} />
            <Button variant="outline" size="sm" onClick={addMs}><Plus size={13} /></Button>
          </div>
          {form.milestones?.map((m, i) => (
            <div key={i} className="flex items-center justify-between bg-surface-2 rounded-lg px-3 py-1.5 text-sm text-slate-300 mb-1">
              <span>{m.title}</span>
              <button onClick={() => setForm((f) => ({ ...f, milestones: f.milestones.filter((_, j) => j !== i) }))}
                className="text-slate-600 hover:text-danger"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>

        <Textarea label="Notes" value={form.notes} onChange={set("notes")} rows={3} placeholder="Notes, links, ideas…" />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={!form.title.trim() || saving}>
            {saving ? "Saving…" : initial ? "Save Changes" : "Create Project"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Progress Ring ─────────────────────────────────────────────────────────────
const ProgressRing = memo(function ProgressRing({ value, color, size = 64 }) {
  const r    = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color || "#6366f1"} strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        transform={`rotate(90, ${size/2}, ${size/2})`}
        fill="#e2e8f0" fontSize={13} fontWeight={600}>{value}%</text>
    </svg>
  );
});

// ── Linked Tasks Section ──────────────────────────────────────────────────────
function LinkedTasksSection({ projectId }) {
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    api.get(`/projects/${projectId}/tasks`)
      .then((res) => { setTasks(res.data.data); setError(null); })
      .catch(() => setError("Failed to load tasks"))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <section>
        <SectionLabel>Linked Tasks</SectionLabel>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Loader2 size={12} className="animate-spin" /> Loading tasks…
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <SectionLabel>Linked Tasks</SectionLabel>
        <p className="text-xs text-slate-500">{error}</p>
      </section>
    );
  }

  if (tasks.length === 0) {
    return (
      <section>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel className="mb-0">Linked Tasks</SectionLabel>
          <span className="text-xs text-slate-600">none yet</span>
        </div>
        <p className="text-xs text-slate-600 italic">No tasks linked to this project.</p>
      </section>
    );
  }

  const done = tasks.filter((t) => t.status === "done").length;

  return (
    <section>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between mb-3 group"
      >
        <SectionLabel className="mb-0">
          Linked Tasks <span className="text-slate-600 font-normal normal-case tracking-normal ml-1">({done}/{tasks.length} done)</span>
        </SectionLabel>
        {expanded
          ? <ChevronUp size={13} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
          : <ChevronDown size={13} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
        }
      </button>

      {expanded && (
        <div className="space-y-1.5">
          {tasks.map((task) => {
            const sm = TASK_STATUS_META[task.status] || TASK_STATUS_META["todo"];
            const pm = PRIORITY_META[task.priority] || PRIORITY_META["medium"];
            const isDone = task.status === "done";
            return (
              <div key={task._id}
                className="bg-surface-2 rounded-lg px-3 py-2.5 flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0">
                  {isDone
                    ? <CheckCircle size={13} className="text-success" />
                    : <Circle size={13} className="text-slate-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={clsx("text-sm leading-snug", isDone ? "line-through text-slate-500" : "text-slate-200")}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full font-medium", sm.color)}>
                      {sm.label}
                    </span>
                    <span className={clsx("text-[10px] font-medium", pm.color)}>
                      {pm.label}
                    </span>
                    {task.dueDate && (
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Calendar size={9} />
                        {new Date(task.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── Project Detail Drawer ─────────────────────────────────────────────────────
function ProjectDrawer({ projectId, projectColor, onClose, onEdit, onDelete, onMilestoneToggle }) {
  const [project, setProject]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    api.get(`/projects/${projectId}`)
      .then((res) => setProject(res.data.data))
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleMilestone = async (milestoneId) => {
    setToggling(milestoneId);
    try {
      await onMilestoneToggle(projectId, milestoneId);
      const res = await api.get(`/projects/${projectId}`);
      setProject(res.data.data);
    } finally { setToggling(null); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    onClose();
    await onDelete(projectId);
  };

  const handleEdit = () => {
    onClose();
    setTimeout(() => onEdit(project), 100);
  };

  const status     = project ? statusMeta(project.status) : null;
  const done       = project?.milestones?.filter((m) => m.done).length || 0;
  const total      = project?.milestones?.length || 0;
  const taskCounts = {};
  (project?.taskStats || []).forEach(({ _id, count }) => { taskCounts[_id] = count; });
  const totalTasks = Object.values(taskCounts).reduce((a, b) => a + b, 0);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full z-50 w-full max-w-lg bg-surface shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start gap-3 px-6 py-5 border-b border-white/[0.06]">
          <div className="h-3.5 w-3.5 rounded-full mt-1.5 shrink-0" style={{ background: projectColor || "#6366f1" }} />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-100 leading-snug truncate">
              {loading ? "Loading…" : project?.title}
            </h2>
            {status && <Badge className={clsx("mt-1", status.color)}>{status.label}</Badge>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {project && <>
              <button onClick={handleEdit}
                className="p-2 rounded-lg text-slate-400 hover:text-brand hover:bg-white/5 transition-colors">
                <Edit2 size={15} /></button>
              <button onClick={handleDelete}
                className="p-2 rounded-lg text-slate-400 hover:text-danger hover:bg-danger/5 transition-colors">
                <Trash2 size={15} /></button>
            </>}
            <button onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-slate-500" />
          </div>
        ) : !project ? (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">Failed to load project</div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1 bg-surface-2 rounded-xl p-4 flex flex-col items-center justify-center gap-1">
                <ProgressRing value={project.progress} color={project.color} />
                <p className="text-xs text-slate-500 mt-1">progress</p>
              </div>
              <div className="bg-surface-2 rounded-xl p-4 flex flex-col justify-center">
                <p className="text-2xl font-bold text-slate-100">
                  {done}<span className="text-sm font-normal text-slate-500">/{total}</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <Target size={11} />Milestones done
                </p>
              </div>
              <div className="bg-surface-2 rounded-xl p-4 flex flex-col justify-center">
                <p className="text-2xl font-bold text-slate-100">{totalTasks}</p>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <BarChart3 size={11} />Linked tasks
                </p>
              </div>
            </div>

            {/* Categories */}
            {project.categories?.length > 0 && (
              <section>
                <SectionLabel>Categories</SectionLabel>
                <div className="flex gap-2 flex-wrap">
                  {project.categories.map((cat) => {
                    const meta = PROJECT_CATEGORIES.find((c) => c.value === cat);
                    return meta ? (
                      <span key={cat} className={clsx("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium", meta.color)}>
                        {meta.icon} {meta.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </section>
            )}

            {/* Description */}
            {project.description && (
              <section>
                <SectionLabel>Description</SectionLabel>
                <p className="text-sm text-slate-300 leading-relaxed">{project.description}</p>
              </section>
            )}

            {/* Links */}
            <section className="space-y-2">
              {project.repoLink && (
                <div>
                  <SectionLabel>Repository</SectionLabel>
                  <a href={project.repoLink} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-brand hover:underline break-all">
                    <GitBranch size={13} />{project.repoLink}<ExternalLink size={11} className="shrink-0" />
                  </a>
                </div>
              )}
              {project.liveUrl && (
                <div>
                  <SectionLabel>Live Site</SectionLabel>
                  <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:underline break-all">
                    <Globe size={13} />{project.liveUrl}<ExternalLink size={11} className="shrink-0" />
                  </a>
                </div>
              )}
            </section>

            {/* Milestones */}
            {total > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel className="mb-0">Milestones</SectionLabel>
                  <span className="text-xs text-slate-500">{done}/{total} complete</span>
                </div>
                <div className="mb-3"><ProgressBar value={project.progress} /></div>
                <div className="space-y-1.5">
                  {project.milestones.map((m) => (
                    <button key={m._id} onClick={() => handleMilestone(m._id)}
                      disabled={toggling === m._id}
                      className={clsx("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all bg-surface-2 hover:bg-white/5",
                        toggling === m._id && "opacity-60 pointer-events-none")}>
                      {m.done
                        ? <CheckCircle size={16} className="text-success shrink-0" />
                        : <Circle size={16} className="text-slate-600 shrink-0" />}
                      <span className={clsx("text-sm flex-1", m.done ? "line-through text-slate-500" : "text-slate-200")}>
                        {m.title}
                      </span>
                      {m.dueDate && (
                        <span className="text-xs text-slate-600 flex items-center gap-1 shrink-0">
                          <Calendar size={10} />{new Date(m.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* ── LINKED TASKS — full list, clickable/expandable ── */}
            <LinkedTasksSection projectId={projectId} />

            {/* Notes */}
            {project.notes && (
              <section>
                <SectionLabel>Notes</SectionLabel>
                <div className="bg-surface-2 rounded-xl px-4 py-3">
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{project.notes}</p>
                </div>
              </section>
            )}

            <section className="border-t border-white/[0.06] pt-4 text-xs text-slate-600 space-y-1">
              <span className="block">Created {new Date(project.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
              <span className="block">Last updated {new Date(project.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
            </section>
          </div>
        )}

        {project && (
          <div className="px-6 py-4 border-t border-white/[0.06]">
            <Button variant="primary" className="w-full" onClick={handleEdit}>
              <Edit2 size={14} /> Edit Project
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

function SectionLabel({ children, className = "mb-2" }) {
  return <p className={clsx("text-xs font-medium text-slate-500 uppercase tracking-wider", className)}>{children}</p>;
}

// ── Project Card ──────────────────────────────────────────────────────────────
const ProjectCard = memo(function ProjectCard({ project, onView, onEdit, onDelete, onMilestoneToggle, onPin, dragging }) {
  // 🌙 Special treatment for Noori
  if (project.title?.toLowerCase().startsWith("noori")) {
    return (
      <NooriCard
        project={project}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        onMilestoneToggle={onMilestoneToggle}
        onPin={onPin}
      />
    );
  }

  const status = statusMeta(project.status);
  const done   = project.milestones?.filter((m) => m.done).length || 0;

  return (
    <div
      className={clsx(
        "card-hover p-5 group flex flex-col gap-3 cursor-pointer relative h-full",
        dragging && "opacity-50 scale-95"
      )}
      onClick={() => onView(project)}
    >
      {/* Pin button */}
      <button
        onClick={(e) => { e.stopPropagation(); onPin(project._id); }}
        className={clsx(
          "absolute top-3 left-3 p-1.5 rounded-md transition-all z-10",
          project.pinned
            ? "text-amber-400 opacity-100"
            : "text-slate-600 opacity-0 group-hover:opacity-100 hover:text-amber-400"
        )}
        title={project.pinned ? "Unpin project" : "Pin to top"}
      >
        {project.pinned ? <Pin size={12} /> : <Pin size={12} />}
      </button>

      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}>
        <button onClick={() => onEdit(project)}
          className="p-1.5 rounded-md text-slate-500 hover:text-brand hover:bg-white/5 transition-colors">
          <Edit2 size={13} /></button>
        <button onClick={() => onDelete(project._id)}
          className="p-1.5 rounded-md text-slate-500 hover:text-danger hover:bg-danger/5 transition-colors">
          <Trash2 size={13} /></button>
      </div>

      <div className="flex items-center gap-3 min-w-0 pr-14 pl-5">
        <div className="h-3 w-3 rounded-full shrink-0" style={{ background: project.color }} />
        <p className="font-semibold text-slate-200 truncate">{project.title}</p>
        {project.pinned && (
          <span className="text-[9px] text-amber-400/70 font-medium uppercase tracking-wider shrink-0">pinned</span>
        )}
      </div>

      {project.description && <p className="text-xs text-slate-500 line-clamp-2 pl-5">{project.description}</p>}

      <div className="flex items-center gap-2 flex-wrap pl-5">
        {status && <Badge className={status.color}>{status.label}</Badge>}
        {project.categories?.map((cat) => {
          const meta = PROJECT_CATEGORIES.find((c) => c.value === cat);
          return meta ? (
            <span key={cat} className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium", meta.color)}>
              {meta.icon} {meta.label}
            </span>
          ) : null;
        })}
        {project.repoLink && (
          <a href={project.repoLink} target="_blank" rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-brand flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}>
            <GitBranch size={11} />Repo</a>
        )}
        {project.liveUrl && (
          <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-emerald-400 flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}>
            <Globe size={11} />Live</a>
        )}
      </div>

      <div className="pl-5">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Progress</span><span>{project.progress}%</span>
        </div>
        <ProgressBar value={project.progress} />
      </div>

      {project.milestones?.length > 0 && (
        <div className="space-y-1.5 pl-5">
          {project.milestones.slice(0, 3).map((m) => (
            <div key={m._id}
              onClick={(e) => { e.stopPropagation(); onMilestoneToggle(project._id, m._id); }}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer">
              {m.done ? <CheckCircle size={12} className="text-success shrink-0" /> : <Circle size={12} className="shrink-0" />}
              <span className={m.done ? "line-through text-slate-600" : ""}>{m.title}</span>
            </div>
          ))}
          {project.milestones.length > 3 && (
            <p className="text-xs text-slate-600 flex items-center gap-1 pl-0">
              +{project.milestones.length - 3} more <ChevronRight size={10} />
            </p>
          )}
        </div>
      )}

      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="text-[10px] text-slate-600 flex items-center gap-0.5">View <ChevronRight size={9} /></span>
      </div>
    </div>
  );
});

// ── Pinned drag-to-reorder section ────────────────────────────────────────────
function PinnedSection({ pinned, onView, onEdit, onDelete, onMilestoneToggle, onPin, onReorder }) {
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [overIdx, setOverIdx]         = useState(null);
  const draggedId = useRef(null);

  if (pinned.length === 0) return null;

  const handleDragStart = (e, idx) => {
    setDraggingIdx(idx);
    draggedId.current = pinned[idx]._id;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIdx(idx);
  };

  const handleDrop = (e, toIdx) => {
    e.preventDefault();
    const fromIdx = draggingIdx;
    if (fromIdx === null || fromIdx === toIdx) {
      setDraggingIdx(null); setOverIdx(null);
      return;
    }
    const reordered = [...pinned];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    onReorder(reordered.map((p) => p._id));
    setDraggingIdx(null); setOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggingIdx(null); setOverIdx(null);
  };

  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 mb-3">
        <Pin size={12} className="text-amber-400" />
        <p className="text-xs font-medium text-amber-400/80 uppercase tracking-wider">Pinned</p>
        {pinned.length > 1 && (
          <p className="text-xs text-slate-600 ml-auto flex items-center gap-1">
            <GripVertical size={10} /> drag to reorder
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {pinned.map((p, idx) => (
          <div
            key={p._id}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            className={clsx(
              "flex flex-col transition-all rounded-2xl",
              overIdx === idx && draggingIdx !== idx && "ring-2 ring-amber-400/40 ring-offset-0"
            )}
          >
            <ProjectCard
              project={p}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onMilestoneToggle={onMilestoneToggle}
              onPin={onPin}
              dragging={draggingIdx === idx}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const [modalOpen, setModal]               = useState(false);
  const [nooriModalOpen, setNooriModal]     = useState(false);
  const [editing, setEditing]               = useState(null);
  const [viewingId, setViewingId]           = useState(null);
  const [viewingColor, setViewingColor]     = useState(null);
  const [viewingIsNoori, setViewingIsNoori] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  const {
    projects, loading,
    createProject, updateProject, toggleMilestone, deleteProject,
    pinProject, reorderPins,
  } = useProjects();

  const openEdit   = (p) => {
    setEditing(p);
    if (p?.title?.toLowerCase().startsWith("noori")) setNooriModal(true);
    else setModal(true);
  };
  const openCreate = () => { setEditing(null); setModal(true); };
  const openView   = (p) => {
    setViewingId(p._id);
    setViewingColor(p.color);
    setViewingIsNoori(p.title?.toLowerCase().startsWith("noori") || false);
  };

  const handleSave = async (payload) => {
    if (editing) await updateProject(editing._id, payload);
    else         await createProject(payload);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this project?")) return;
    if (viewingId === id) setViewingId(null);
    await deleteProject(id);
  };

  const handlePin = useCallback(async (id) => {
    await pinProject(id);
  }, [pinProject]);

  const handleReorder = useCallback(async (orderedIds) => {
    await reorderPins(orderedIds);
  }, [reorderPins]);

  const filtered = activeCategory
    ? projects.filter((p) => p.categories?.includes(activeCategory))
    : projects;

  const pinnedProjects = filtered.filter((p) => p.pinned);
  const restProjects   = filtered.filter((p) => !p.pinned);

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Projects</h1>
            <p className="text-sm text-slate-500 mt-0.5">{filtered.length} project{filtered.length !== 1 ? "s" : ""}</p>
          </div>
          <Button variant="primary" onClick={openCreate}><Plus size={15} /> New Project</Button>
        </div>

        {/* Category filter tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory(null)}
            className={clsx(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
              activeCategory === null
                ? "bg-white/10 text-slate-200 border-white/20"
                : "bg-transparent text-slate-500 border-white/10 hover:border-white/20"
            )}
          >
            All
          </button>
          {PROJECT_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(activeCategory === cat.value ? null : cat.value)}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                activeCategory === cat.value
                  ? `${cat.color} border-current`
                  : "bg-transparent text-slate-500 border-white/10 hover:border-white/20"
              )}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={FolderOpen} title="No projects here" description={activeCategory ? "No projects in this category yet." : "Start building something great."}
            action={<Button variant="primary" onClick={openCreate}><Plus size={15} />New Project</Button>} />
        ) : (
          <div className="space-y-6">
            {/* Pinned section with drag-to-reorder */}
            {pinnedProjects.length > 0 && (
              <PinnedSection
                pinned={pinnedProjects}
                onView={openView}
                onEdit={openEdit}
                onDelete={handleDelete}
                onMilestoneToggle={toggleMilestone}
                onPin={handlePin}
                onReorder={handleReorder}
              />
            )}

            {/* Rest of projects */}
            {restProjects.length > 0 && (
              <div>
                {pinnedProjects.length > 0 && (
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wider mb-3">Other Projects</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {restProjects.map((p) => (
                    <ProjectCard
                      key={p._id}
                      project={p}
                      onView={openView}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                      onMilestoneToggle={toggleMilestone}
                      onPin={handlePin}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {viewingId && (
        viewingIsNoori
          ? <NooriDrawer
              projectId={viewingId}
              onClose={() => setViewingId(null)}
              onEdit={openEdit}
              onDelete={handleDelete}
              onMilestoneToggle={toggleMilestone}
            />
          : <ProjectDrawer
              projectId={viewingId}
              projectColor={viewingColor}
              onClose={() => setViewingId(null)}
              onEdit={openEdit}
              onDelete={handleDelete}
              onMilestoneToggle={toggleMilestone}
            />
      )}

      <ProjectModal open={modalOpen} onClose={() => setModal(false)} onSave={handleSave} initial={editing} />
      <NooriEditModal open={nooriModalOpen} onClose={() => setNooriModal(false)} onSave={handleSave} initial={editing} />
    </PageWrapper>
  );
}