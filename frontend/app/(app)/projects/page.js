"use client";

import { useState, useEffect } from "react";
import {
  Plus, Trash2, Edit2, ExternalLink, CheckCircle, Circle,
  FolderOpen, X, GitBranch, Target, ChevronRight,
  Calendar, BarChart3, Globe, Loader2,
} from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { Button, Badge, ProgressBar, Spinner, EmptyState, Input, Select, Textarea } from "@/components/ui";
import Modal from "@/components/ui/Modal";
import PageWrapper from "@/components/layout/PageWrapper";
import { PROJECT_STATUSES, PROJECT_COLORS, PROJECT_CATEGORIES } from "@/lib/constants";
import api from "@/lib/api";
import clsx from "clsx";
import NooriCard from "@/components/projects/NooriCard";

const statusMeta = (value) => PROJECT_STATUSES.find((s) => s.value === value);

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
        {/* NEW: Live URL field */}
        <Input label="Live / Deployed URL" value={form.liveUrl || ""} onChange={set("liveUrl")} placeholder="https://yoursite.com" />

        {/* Color picker */}
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

        {/* Categories multi-select */}
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

        {/* Milestones */}
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
function ProgressRing({ value, color, size = 64 }) {
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
}

// ── Project Detail Drawer ─────────────────────────────────────────────────────
function ProjectDrawer({ projectId, projectColor, onClose, onEdit, onDelete, onMilestoneToggle }) {
  const [project, setProject]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [toggling, setToggling] = useState(null);

  // FIX: Fetch the SINGLE project endpoint to get taskStats
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
      // Refresh drawer data after toggle
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
                <Edit2 size={15} />
              </button>
              <button onClick={handleDelete}
                className="p-2 rounded-lg text-slate-400 hover:text-danger hover:bg-danger/5 transition-colors">
                <Trash2 size={15} />
              </button>
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
              {/* FIX: Now shows real task count from single endpoint */}
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

            {/* Task breakdown — only show if tasks exist */}
            {totalTasks > 0 && (
              <section>
                <SectionLabel>Tasks by status</SectionLabel>
                <div className="space-y-1.5">
                  {Object.entries(taskCounts).map(([st, count]) => (
                    <div key={st} className="flex items-center justify-between bg-surface-2 rounded-lg px-3 py-2">
                      <span className="text-sm text-slate-400 capitalize">{st.replace(/-/g, " ")}</span>
                      <span className="text-sm font-medium text-slate-200">{count}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

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
function ProjectCard({ project, onView, onEdit, onDelete, onMilestoneToggle }) {
  // 🌙 Special treatment for Noori
  if (project.title?.toLowerCase().startsWith("noori")) {
    return (
      <NooriCard
        project={project}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        onMilestoneToggle={onMilestoneToggle}
      />
    );
  }

  const status = statusMeta(project.status);
  const done   = project.milestones?.filter((m) => m.done).length || 0;

  return (
    <div className="card-hover p-5 group flex flex-col gap-3 cursor-pointer relative" onClick={() => onView(project)}>
      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}>
        <button onClick={() => onEdit(project)}
          className="p-1.5 rounded-md text-slate-500 hover:text-brand hover:bg-white/5 transition-colors">
          <Edit2 size={13} /></button>
        <button onClick={() => onDelete(project._id)}
          className="p-1.5 rounded-md text-slate-500 hover:text-danger hover:bg-danger/5 transition-colors">
          <Trash2 size={13} /></button>
      </div>

      <div className="flex items-center gap-3 min-w-0 pr-14">
        <div className="h-3 w-3 rounded-full shrink-0" style={{ background: project.color }} />
        <p className="font-semibold text-slate-200 truncate">{project.title}</p>
      </div>

      {project.description && <p className="text-xs text-slate-500 line-clamp-2">{project.description}</p>}

      <div className="flex items-center gap-2 flex-wrap">
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

      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Progress</span><span>{project.progress}%</span>
        </div>
        <ProgressBar value={project.progress} />
      </div>

      {project.milestones?.length > 0 && (
        <div className="space-y-1.5">
          {project.milestones.slice(0, 3).map((m) => (
            <div key={m._id}
              onClick={(e) => { e.stopPropagation(); onMilestoneToggle(project._id, m._id); }}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer">
              {m.done ? <CheckCircle size={12} className="text-success shrink-0" /> : <Circle size={12} className="shrink-0" />}
              <span className={m.done ? "line-through text-slate-600" : ""}>{m.title}</span>
            </div>
          ))}
          {project.milestones.length > 3 && (
            <p className="text-xs text-slate-600 flex items-center gap-1">
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
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const [modalOpen, setModal]     = useState(false);
  const [editing, setEditing]     = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [viewingColor, setViewingColor] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  const { projects, loading, createProject, updateProject, toggleMilestone, deleteProject } = useProjects();

  const openEdit   = (p) => { setEditing(p); setModal(true); };
  const openCreate = () =>  { setEditing(null); setModal(true); };
  const openView   = (p) => { setViewingId(p._id); setViewingColor(p.color); };

  const handleSave = async (payload) => {
    if (editing) await updateProject(editing._id, payload);
    else         await createProject(payload);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this project?")) return;
    if (viewingId === id) setViewingId(null);
    await deleteProject(id);
  };

  const filteredProjects = activeCategory
    ? projects.filter((p) => p.categories?.includes(activeCategory))
    : projects;

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Projects</h1>
            <p className="text-sm text-slate-500 mt-0.5">{filteredProjects.length} project{filteredProjects.length !== 1 ? "s" : ""}</p>
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
        ) : filteredProjects.length === 0 ? (
          <EmptyState icon={FolderOpen} title="No projects here" description={activeCategory ? "No projects in this category yet." : "Start building something great."}
            action={<Button variant="primary" onClick={openCreate}><Plus size={15} />New Project</Button>} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProjects.map((p) => (
              <ProjectCard key={p._id} project={p} onView={openView}
                onEdit={openEdit} onDelete={handleDelete} onMilestoneToggle={toggleMilestone} />
            ))}
          </div>
        )}
      </div>

      {/* FIX: Drawer fetches single project by ID — gets real taskStats */}
      {viewingId && (
        <ProjectDrawer
          projectId={viewingId}
          projectColor={viewingColor}
          onClose={() => setViewingId(null)}
          onEdit={openEdit}
          onDelete={handleDelete}
          onMilestoneToggle={toggleMilestone}
        />
      )}

      <ProjectModal open={modalOpen} onClose={() => setModal(false)} onSave={handleSave} initial={editing} />
    </PageWrapper>
  );
}