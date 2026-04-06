"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, GraduationCap, ExternalLink, X, BookOpen, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useLearning } from "@/hooks/useIdeas";
import { Button, Badge, ProgressBar, Spinner, EmptyState, Input, Select, Textarea } from "@/components/ui";
import Modal from "@/components/ui/Modal";
import PageWrapper from "@/components/layout/PageWrapper";
import { LEARNING_CATEGORIES, LEARNING_STATUSES } from "@/lib/constants";
import clsx from "clsx";

const BLANK = { title: "", category: "skill", progress: 0, status: "not-started", notes: "", tags: "", resources: [] };

// ── Edit / Create Modal ───────────────────────────────────────────────────────
function LearningModal({ open, onClose, onSave, initial }) {
  const [form, setForm]         = useState(BLANK);
  const [resTitle, setResTitle] = useState("");
  const [resUrl, setResUrl]     = useState("");
  const [saving, setSaving]     = useState(false);

  // Use a stable key derived from the item id (or "new") to force a full
  // remount when switching between items — avoids stale-closure issues entirely.
  // We pass this as the `key` prop on the Modal from the parent.
  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        ...BLANK,
        ...initial,
        tags: Array.isArray(initial.tags) ? initial.tags.join(", ") : (initial.tags || ""),
        resources: Array.isArray(initial.resources) ? initial.resources : [],
      });
    } else {
      setForm(BLANK);
    }
    setResTitle("");
    setResUrl("");
  }, [open, initial?._id]); // reset when modal opens OR when the target item changes

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const addResource = () => {
    if (!resTitle.trim()) return;
    setForm((f) => ({ ...f, resources: [...(f.resources || []), { title: resTitle.trim(), url: resUrl.trim() }] }));
    setResTitle(""); setResUrl("");
  };

  const removeResource = (i) =>
    setForm((f) => ({ ...f, resources: f.resources.filter((_, j) => j !== i) }));

  const handleSave = async () => {
    if (!form.title.trim()) return;
    const payload = {
      ...form,
      tags: typeof form.tags === "string"
        ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : (form.tags || []),
      progress: Number(form.progress),
      // always send status explicitly so the backend doesn't auto-override it
      status: form.status,
    };
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
          <Select label="Status" value={form.status} onChange={set("status")}>
            {LEARNING_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400 mb-1 block">Progress: {form.progress}%</label>
          <input type="range" min="0" max="100" value={form.progress}
            onChange={(e) => setForm((f) => ({ ...f, progress: Number(e.target.value) }))}
            className="w-full accent-brand" />
        </div>
        <Input label="Tags" value={form.tags} onChange={set("tags")} placeholder="frontend, design, system" />
        <div>
          <p className="text-xs font-medium text-slate-400 mb-2">Resources</p>
          <div className="flex gap-2 mb-2">
            <input className="input-base flex-1 text-sm" placeholder="Title" value={resTitle}
              onChange={(e) => setResTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addResource())} />
            <input className="input-base flex-1 text-sm" placeholder="URL (optional)" value={resUrl}
              onChange={(e) => setResUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addResource())} />
            <Button variant="outline" size="sm" onClick={addResource}><Plus size={13} /></Button>
          </div>
          {form.resources?.map((r, i) => (
            <div key={i} className="flex items-center justify-between bg-surface-2 rounded-lg px-3 py-1.5 text-sm mb-1">
              <span className="text-slate-300 truncate flex-1">{r.title}</span>
              {r.url && (
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-brand hover:text-brand-light ml-2 shrink-0">
                  <ExternalLink size={12} />
                </a>
              )}
              <button onClick={() => removeResource(i)} className="text-slate-600 hover:text-danger ml-2 shrink-0">
                <Trash2 size={12} />
              </button>
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

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function LearningDrawer({ itemId, onClose, onEdit, onDelete }) {
  const [item, setItem]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!itemId) return;
    setLoading(true);
    api.get(`/learning/${itemId}`)
      .then((res) => setItem(res.data.data))
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [itemId]);

  const status = item ? LEARNING_STATUSES.find((s) => s.value === item.status) : null;
  const cat    = item ? LEARNING_CATEGORIES.find((c) => c.value === item.category) : null;

  const handleDelete = async () => {
    if (!confirm("Delete this item?")) return;
    onClose();
    await onDelete(itemId);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full z-50 w-full max-w-lg bg-surface shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start gap-3 px-6 py-5 border-b border-white/[0.06]">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-100 leading-snug">
              {loading ? "Loading…" : item?.title}
            </h2>
            {item && (
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {cat   && <Badge className="bg-surface-3 text-slate-400">{cat.label}</Badge>}
              {status && <Badge className={status.color}>{status.label}</Badge>}
              {item.tags?.map((t) => (
                <Badge key={t} className="bg-surface-2 text-slate-500 text-xs">{t}</Badge>
              ))}
            </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {item && <>
            <button onClick={() => onEdit(item)}
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
        ) : !item ? (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">Failed to load item</div>
        ) : (
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <section>
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span className="uppercase tracking-wider font-medium">Progress</span>
              <span className="font-semibold text-slate-300">{item.progress}%</span>
            </div>
            <ProgressBar value={item.progress} color="bg-indigo-500" />
          </section>

          {item.resources?.length > 0 && (
            <section>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Resources</p>
              <div className="space-y-2">
                {item.resources.map((r, i) => (
                  <a key={i} href={r.url || "#"} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 bg-surface-2 rounded-xl text-sm text-slate-300 hover:text-brand hover:bg-white/5 transition-colors group">
                    <BookOpen size={14} className="text-slate-500 group-hover:text-brand shrink-0" />
                    <span className="flex-1 truncate">{r.title}</span>
                    {r.url && <ExternalLink size={12} className="text-slate-600 group-hover:text-brand shrink-0" />}
                  </a>
                ))}
              </div>
            </section>
          )}

          {item.notes && (
            <section>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Notes</p>
              <div className="bg-surface-2 rounded-xl px-4 py-3">
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{item.notes}</p>
              </div>
            </section>
          )}

          <section className="border-t border-white/[0.06] pt-4 text-xs text-slate-600 space-y-1">
            {item.createdAt && <span className="block">Created {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>}
            {item.updatedAt && <span className="block">Updated {new Date(item.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>}
          </section>
        </div>
        )}

        {item && (
        <div className="px-6 py-4 border-t border-white/[0.06]">
          <Button variant="primary" className="w-full" onClick={() => onEdit(item)}>
            <Edit2 size={14} /> Edit Item
          </Button>
        </div>
        )}
      </div>
    </>
  );
}

// ── Skill Card ────────────────────────────────────────────────────────────────
function SkillCard({ item, onView }) {
  const status = LEARNING_STATUSES.find((s) => s.value === item.status);
  const cat    = LEARNING_CATEGORIES.find((c) => c.value === item.category);

  return (
    <div className="card-hover p-5 flex flex-col gap-3 cursor-pointer" onClick={() => onView(item)}>
      <div className="min-w-0">
        <p className="font-semibold text-slate-200 truncate">{item.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge className="bg-surface-3 text-slate-400">{cat?.label}</Badge>
          {status && <Badge className={status.color}>{status.label}</Badge>}
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
            <span key={i} className="flex items-center gap-1 text-xs text-slate-500 bg-surface-2 rounded px-2 py-1">
              <ExternalLink size={9} />{r.title}
            </span>
          ))}
          {item.resources.length > 2 && (
            <span className="text-xs text-slate-600 px-2 py-1">+{item.resources.length - 2} more</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LearningPage() {
  const [modalOpen, setModal]     = useState(false);
  const [editing, setEditing]     = useState(null);
  const [viewing, setViewing]     = useState(null);
  const [filterStatus, setFilter] = useState("");
  const { items, loading, createItem, updateItem, deleteItem } =
    useLearning(filterStatus ? { status: filterStatus } : {});

  const openView = (i) => setViewing(i._id);

  // Open edit: always set editing BEFORE opening modal so the key+initial are ready
  const openEdit = (i) => {
    setViewing(null);
    setEditing(i);
    // Defer modal open by one tick so React flushes setEditing first
    setTimeout(() => setModal(true), 0);
  };

  const openCreate = () => {
    setEditing(null);
    setModal(true);
  };

  const handleSave = async (p) => {
    const saved = editing ? await updateItem(editing._id, p) : await createItem(p);
    // If the drawer was open for this item, refresh it with the new data
    // drawer re-fetches from API on its own after save
  };

  const handleDelete = async (id) => {
    await deleteItem(id);
  };

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
              className={clsx("px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                filterStatus === s.value ? "bg-brand/15 text-brand" : "text-slate-400 hover:text-slate-200 hover:bg-surface-2")}>
              {s.label}
            </button>
          ))}
        </div>

        {loading
          ? <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          : items.length === 0
            ? <EmptyState icon={GraduationCap} title="Nothing to learn?" description="Add skills, courses, and books."
                action={<Button variant="primary" onClick={openCreate}><Plus size={15} />Add Item</Button>} />
            : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map((i) => <SkillCard key={i._id} item={i} onView={openView} />)}
              </div>
            )
        }
      </div>

      <LearningModal
        key={editing?._id ?? "new"}
        open={modalOpen}
        onClose={() => setModal(false)}
        onSave={handleSave}
        initial={editing}
      />

      {viewing && (
        <LearningDrawer
          itemId={viewing}
          onClose={() => setViewing(null)}
          onEdit={openEdit}
          onDelete={async (id) => { setViewing(null); await handleDelete(id); }}
        />
      )}
    </PageWrapper>
  );
}