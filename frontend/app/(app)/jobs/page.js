"use client";

import { useState, useEffect } from "react";
import {
  Plus, Trash2, Edit2, ExternalLink, Briefcase,
  X, User, DollarSign, Calendar, Link2, StickyNote,
  ArrowRight, ChevronRight,
} from "lucide-react";
import { useJobs } from "@/hooks/useProjects";
import {
  Button, Badge, Spinner, EmptyState,
  Input, Select, Textarea,
} from "@/components/ui";
import Modal from "@/components/ui/Modal";
import PageWrapper from "@/components/layout/PageWrapper";
import { JOB_STAGES } from "@/lib/constants";
import clsx from "clsx";

// ── Job Modal (create / edit) ─────────────────────────────────────────────────
function JobModal({ open, onClose, onSave, initial }) {
  const blank = {
    company: "", role: "", stage: "saved", notes: "",
    contactPerson: "", salary: "", jobUrl: "",
    followUpDate: "", appliedDate: "",
  };
  const [form, setForm]     = useState(blank);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (open) setForm(initial || blank);
  }, [open, initial]);

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
            {JOB_STAGES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
          <Input label="Salary Range" value={form.salary} onChange={set("salary")} placeholder="$120k–$150k" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Contact Person" value={form.contactPerson} onChange={set("contactPerson")} placeholder="Recruiter name" />
          <Input label="Job URL" value={form.jobUrl} onChange={set("jobUrl")} placeholder="https://…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Applied Date" type="date" value={form.appliedDate || ""} onChange={set("appliedDate")} />
          <Input label="Follow-up Date" type="date" value={form.followUpDate || ""} onChange={set("followUpDate")} />
        </div>
        <Textarea label="Notes" value={form.notes} onChange={set("notes")} rows={4} placeholder="Interview notes, thoughts…" />
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

// ── Stage Pill (inline stage mover inside drawer) ─────────────────────────────
function StageStepper({ currentStage, onMove, moving }) {
  return (
    <div className="flex flex-col gap-1.5">
      {JOB_STAGES.map((s, idx) => {
        const currentIdx = JOB_STAGES.findIndex((x) => x.value === currentStage);
        const isActive   = s.value === currentStage;
        const isPast     = idx < currentIdx;

        return (
          <button
            key={s.value}
            onClick={() => !isActive && onMove(s.value)}
            disabled={isActive || moving}
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all",
              isActive
                ? "bg-brand/10 border border-brand/30 text-brand font-medium cursor-default"
                : isPast
                ? "text-slate-600 hover:text-slate-400 hover:bg-white/5 cursor-pointer"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 cursor-pointer",
              moving && "opacity-50 pointer-events-none",
            )}
          >
            {/* dot */}
            <span className={clsx(
              "h-2 w-2 rounded-full shrink-0",
              isActive ? "bg-brand" : isPast ? "bg-slate-600" : "bg-slate-700",
            )} />
            <span className={clsx(isPast && "line-through")}>{s.label}</span>
            {!isActive && !isPast && (
              <ArrowRight size={12} className="ml-auto opacity-40" />
            )}
            {isActive && (
              <span className="ml-auto text-xs font-normal opacity-60">current</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Job Detail Drawer ─────────────────────────────────────────────────────────
function JobDrawer({ job, onClose, onEdit, onDelete, onStageChange }) {
  const [moving, setMoving] = useState(false);

  if (!job) return null;

  const stage = JOB_STAGES.find((s) => s.value === job.stage);

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

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full z-50 w-full max-w-lg bg-surface shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-100 leading-snug">{job.role}</h2>
              <p className="text-sm text-slate-400 mt-0.5">{job.company}</p>
              {stage && <Badge className={clsx("mt-2", stage.color)}>{stage.label}</Badge>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => { onClose(); setTimeout(() => onEdit(job), 100); }}
                className="p-2 rounded-lg text-slate-400 hover:text-brand hover:bg-white/5 transition-colors"
                title="Edit"
              >
                <Edit2 size={15} />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 rounded-lg text-slate-400 hover:text-danger hover:bg-danger/5 transition-colors"
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Quick info chips */}
          <div className="flex flex-wrap gap-2">
            {job.salary && (
              <InfoChip icon={<DollarSign size={12} />}>{job.salary}</InfoChip>
            )}
            {job.contactPerson && (
              <InfoChip icon={<User size={12} />}>{job.contactPerson}</InfoChip>
            )}
            {job.appliedDate && (
              <InfoChip icon={<Calendar size={12} />}>Applied {fmt(job.appliedDate)}</InfoChip>
            )}
            {job.followUpDate && (
              <InfoChip icon={<Calendar size={12} />}>Follow-up {fmt(job.followUpDate)}</InfoChip>
            )}
          </div>

          {/* Job URL */}
          {job.jobUrl && (
            <section>
              <SectionLabel>Job Posting</SectionLabel>
              <a
                href={job.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-brand hover:underline break-all"
              >
                <Link2 size={13} />
                {job.jobUrl}
                <ExternalLink size={11} className="shrink-0" />
              </a>
            </section>
          )}

          {/* Notes */}
          {job.notes && (
            <section>
              <SectionLabel>Notes</SectionLabel>
              <div className="bg-surface-2 rounded-xl px-4 py-3">
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{job.notes}</p>
              </div>
            </section>
          )}

          {/* Move stage */}
          <section>
            <SectionLabel>Move to stage</SectionLabel>
            <StageStepper currentStage={job.stage} onMove={handleMove} moving={moving} />
          </section>

          {/* Meta */}
          <section className="border-t border-white/[0.06] pt-4 text-xs text-slate-600 space-y-1">
            <p>Added {fmt(job.createdAt)}</p>
            <p>Last updated {fmt(job.updatedAt)}</p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06]">
          <Button
            variant="primary"
            className="w-full"
            onClick={() => { onClose(); setTimeout(() => onEdit(job), 100); }}
          >
            <Edit2 size={14} /> Edit Application
          </Button>
        </div>
      </div>
    </>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
      {children}
    </p>
  );
}

function InfoChip({ icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-2 text-xs text-slate-400">
      {icon}{children}
    </span>
  );
}

// ── Job Card ──────────────────────────────────────────────────────────────────
function JobCard({ job, onView, onEdit, onDelete }) {
  const stage = JOB_STAGES.find((s) => s.value === job.stage);

  return (
    <div
      className="card p-4 group flex flex-col gap-2 cursor-pointer relative"
      onClick={() => onView(job)}
    >
      {/* Action buttons */}
      <div
        className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onEdit(job)}
          className="p-1.5 rounded-md text-slate-500 hover:text-brand hover:bg-white/5"
        >
          <Edit2 size={12} />
        </button>
        <button
          onClick={() => onDelete(job._id)}
          className="p-1.5 rounded-md text-slate-500 hover:text-danger hover:bg-danger/5"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="min-w-0 pr-14">
        <p className="font-semibold text-slate-200 text-sm truncate">{job.role}</p>
        <p className="text-xs text-slate-500 truncate mt-0.5">{job.company}</p>
      </div>

      {job.salary && (
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <DollarSign size={10} />{job.salary}
        </p>
      )}

      {job.jobUrl && (
        <a
          href={job.jobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-brand hover:text-brand-light flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={10} />View Job
        </a>
      )}

      {job.followUpDate && (
        <p className="text-xs text-slate-600 flex items-center gap-1 mt-auto">
          <Calendar size={10} />
          Follow-up {new Date(job.followUpDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </p>
      )}

      {/* hover hint */}
      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="text-[10px] text-slate-600 flex items-center gap-0.5">
          View <ChevronRight size={9} />
        </span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function JobsPage() {
  const [modalOpen, setModal]   = useState(false);
  const [editing, setEditing]   = useState(null);
  const [viewing, setViewing]   = useState(null);

  const { jobs, loading, createJob, updateJob, patchStage, deleteJob } = useJobs();

  const normalise = (j) => j
    ? { ...j, appliedDate: j.appliedDate?.slice(0, 10) || "", followUpDate: j.followUpDate?.slice(0, 10) || "" }
    : null;

  const openEdit   = (j) => { setEditing(normalise(j)); setModal(true); };
  const openCreate = () =>  { setEditing(null); setModal(true); };
  const openView   = (j) => setViewing(j);

  // Keep drawer in sync when jobs list updates (e.g. after stage change)
  useEffect(() => {
    if (!viewing) return;
    const fresh = jobs.find((j) => j._id === viewing._id);
    if (fresh) setViewing(fresh);
  }, [jobs]);

  const handleSave = async (payload) => {
    if (editing) await updateJob(editing._id, payload);
    else         await createJob(payload);
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this application?")) return;
    if (viewing?._id === id) setViewing(null);
    await deleteJob(id);
  };

  const handleStageChange = async (id, stage) => {
    await patchStage(id, stage);
  };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-5">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Job Pipeline</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {jobs.length} application{jobs.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button variant="primary" onClick={openCreate}>
            <Plus size={15} />Add Application
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No applications yet"
            description="Start tracking your job search."
            action={
              <Button variant="primary" onClick={openCreate}>
                <Plus size={15} />Add Application
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-5 gap-4">
            {JOB_STAGES.map(({ value, label, color }) => {
              const col = jobs.filter((j) => j.stage === value);
              return (
                <div key={value} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between px-1">
                    <Badge className={color}>{label}</Badge>
                    <span className="text-xs text-slate-600">{col.length}</span>
                  </div>
                  <div className="flex-1 space-y-2 bg-surface-2/40 rounded-xl p-2 border border-surface-3 min-h-[300px]">
                    {col.map((j) => (
                      <JobCard
                        key={j._id}
                        job={j}
                        onView={openView}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                    {col.length === 0 && (
                      <p className="text-xs text-slate-600 text-center py-8">Empty</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {viewing && (
        <JobDrawer
          job={viewing}
          onClose={() => setViewing(null)}
          onEdit={openEdit}
          onDelete={handleDelete}
          onStageChange={handleStageChange}
        />
      )}

      {/* Create / Edit modal */}
      <JobModal
        open={modalOpen}
        onClose={() => setModal(false)}
        onSave={handleSave}
        initial={editing}
      />
    </PageWrapper>
  );
}