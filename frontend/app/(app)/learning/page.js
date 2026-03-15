"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, GraduationCap, ExternalLink } from "lucide-react";
import { useLearning } from "@/hooks/useIdeas";
import { Button, Badge, ProgressBar, Spinner, EmptyState, Input, Select, Textarea } from "@/components/ui";
import Modal from "@/components/ui/Modal";
import PageWrapper from "@/components/layout/PageWrapper";
import { LEARNING_CATEGORIES, LEARNING_STATUSES } from "@/lib/constants";
import clsx from "clsx";

function LearningModal({ open, onClose, onSave, initial }) {
  const blank = { title: "", category: "skill", progress: 0, status: "not-started", notes: "", tags: "", resources: [] };
  const [form, setForm] = useState(blank);
  const [resTitle, setResTitle] = useState("");
  const [resUrl, setResUrl]     = useState("");
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (open) setForm(initial || blank);
  }, [open, initial]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const addResource = () => {
    if (!resTitle.trim()) return;
    setForm({ ...form, resources: [...form.resources, { title: resTitle.trim(), url: resUrl.trim() }] });
    setResTitle(""); setResUrl("");
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    const payload = { ...form, tags: typeof form.tags === "string" ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : form.tags, progress: Number(form.progress) };
    try { setSaving(true); await onSave(payload); onClose(); } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Item" : "Add Learning Item"} size="lg">
      <div className="space-y-4">
        <Input label="Title *" value={form.title} onChange={set("title")} placeholder="React Advanced Patterns" />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" value={form.category} onChange={set("category")}>
            {LEARNING_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Progress: {form.progress}%</label>
            <input type="range" min="0" max="100" value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
              className="w-full accent-brand" />
          </div>
        </div>
        <Input label="Tags" value={Array.isArray(form.tags) ? form.tags.join(", ") : form.tags} onChange={set("tags")} placeholder="frontend, design, system" />
        {/* Resources */}
        <div>
          <p className="text-xs font-medium text-slate-400 mb-2">Resources</p>
          <div className="flex gap-2 mb-2">
            <input className="input-base flex-1 text-sm" placeholder="Title" value={resTitle} onChange={(e) => setResTitle(e.target.value)} />
            <input className="input-base flex-1 text-sm" placeholder="URL" value={resUrl} onChange={(e) => setResUrl(e.target.value)} />
            <Button variant="outline" size="sm" onClick={addResource}><Plus size={13} /></Button>
          </div>
          {form.resources?.map((r, i) => (
            <div key={i} className="flex items-center justify-between bg-surface-2 rounded-lg px-3 py-1.5 text-sm mb-1">
              <span className="text-slate-300">{r.title}</span>
              {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-brand hover:text-brand-light ml-2"><ExternalLink size={12} /></a>}
              <button onClick={() => setForm({ ...form, resources: form.resources.filter((_, j) => j !== i) })} className="text-slate-600 hover:text-danger ml-2"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
        <Textarea label="Notes" value={form.notes} onChange={set("notes")} rows={3} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={!form.title.trim() || saving}>
            {saving ? "Saving…" : initial ? "Save Changes" : "Add Item"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function SkillCard({ item, onEdit, onDelete, onProgress }) {
  const status = LEARNING_STATUSES.find((s) => s.value === item.status);
  const cat    = LEARNING_CATEGORIES.find((c) => c.value === item.category);

  return (
    <div className="card-hover p-5 group flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="font-semibold text-slate-200 truncate">{item.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge className="bg-surface-3 text-slate-400">{cat?.label}</Badge>
            {status && <Badge className={status.color}>{status.label}</Badge>}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0 ml-2">
          <button onClick={() => onEdit(item)} className="p-1 text-slate-500 hover:text-brand"><Edit2 size={13} /></button>
          <button onClick={() => onDelete(item._id)} className="p-1 text-slate-500 hover:text-danger"><Trash2 size={13} /></button>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Progress</span><span>{item.progress}%</span>
        </div>
        <ProgressBar value={item.progress} color="bg-indigo-500" />
      </div>
      {item.resources?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.resources.slice(0, 2).map((r, i) => (
            <a key={i} href={r.url || "#"} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-brand bg-surface-2 rounded px-2 py-1">
              <ExternalLink size={9} />{r.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LearningPage() {
  const [modalOpen, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterStatus, setFilter] = useState("");
  const { items, loading, createItem, updateItem, patchProgress, deleteItem } = useLearning(filterStatus ? { status: filterStatus } : {});

  const openEdit   = (i) => { setEditing({ ...i, tags: Array.isArray(i.tags) ? i.tags.join(", ") : i.tags }); setModal(true); };
  const openCreate = () => { setEditing(null); setModal(true); };
  const handleSave = async (p) => { if (editing) await updateItem(editing._id, p); else await createItem(p); };
  const handleDelete = async (id) => { if (!confirm("Delete this item?")) return; await deleteItem(id); };

  const inProgress = items.filter((i) => i.status === "in-progress").length;
  const completed  = items.filter((i) => i.status === "completed").length;

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Learning Tracker</h1>
            <p className="text-sm text-slate-500 mt-0.5">{inProgress} in progress · {completed} completed</p>
          </div>
          <Button variant="primary" onClick={openCreate}><Plus size={15} />Add Item</Button>
        </div>

        <div className="flex gap-2">
          {[{ value: "", label: "All" }, ...LEARNING_STATUSES].map((s) => (
            <button key={s.value} onClick={() => setFilter(s.value)}
              className={clsx("px-3 py-1.5 rounded-lg text-sm font-medium transition-colors", filterStatus === s.value ? "bg-brand/15 text-brand" : "text-slate-400 hover:text-slate-200 hover:bg-surface-2")}>
              {s.label}
            </button>
          ))}
        </div>

        {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        : items.length === 0 ? <EmptyState icon={GraduationCap} title="Nothing to learn?" description="Add skills, courses, and books." action={<Button variant="primary" onClick={openCreate}><Plus size={15} />Add Item</Button>} />
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((i) => <SkillCard key={i._id} item={i} onEdit={openEdit} onDelete={handleDelete} onProgress={patchProgress} />)}
          </div>
        )}
      </div>
      <LearningModal open={modalOpen} onClose={() => setModal(false)} onSave={handleSave} initial={editing} />
    </PageWrapper>
  );
}