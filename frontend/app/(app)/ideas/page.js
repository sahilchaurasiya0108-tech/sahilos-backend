"use client";
// ── IDEA VAULT PAGE ───────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Plus, Star, Trash2, Edit2, Lightbulb, ArrowRight } from "lucide-react";
import { useIdeas } from "@/hooks/useIdeas";
import { Button, Badge, Spinner, EmptyState, Input, Select, Textarea } from "@/components/ui";
import Modal from "@/components/ui/Modal";
import PageWrapper from "@/components/layout/PageWrapper";
import clsx from "clsx";

function IdeaModal({ open, onClose, onSave, initial }) {
  const blank = { title: "", description: "", tags: "", rating: 3, status: "raw" };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initial || blank);
  }, [open, initial]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSave = async () => {
    if (!form.title.trim()) return;
    const payload = { ...form, tags: typeof form.tags === "string" ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : form.tags, rating: Number(form.rating) };
    try { setSaving(true); await onSave(payload); onClose(); } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Idea" : "Capture Idea"}>
      <div className="space-y-4">
        <Input label="Title *" value={form.title} onChange={set("title")} placeholder="Your idea…" />
        <Textarea label="Description" value={form.description} onChange={set("description")} rows={4} placeholder="Describe it in detail…" />
        <Input label="Tags (comma separated)" value={Array.isArray(form.tags) ? form.tags.join(", ") : form.tags} onChange={set("tags")} placeholder="saas, mobile, ai" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium text-slate-400 mb-1">Rating</p>
            <div className="flex gap-1">
              {[1,2,3,4,5].map((n) => (
                <button key={n} onClick={() => setForm({ ...form, rating: n })}
                  className={clsx("text-xl transition-colors", n <= form.rating ? "text-amber-400" : "text-slate-700 hover:text-amber-600")}>
                  ★
                </button>
              ))}
            </div>
          </div>
          <Select label="Status" value={form.status} onChange={set("status")}>
            <option value="raw">Raw</option>
            <option value="refined">Refined</option>
          </Select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={!form.title.trim() || saving}>
            {saving ? "Saving…" : initial ? "Save Changes" : "Save Idea"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function IdeasPage() {
  const [modalOpen, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const { ideas, loading, createIdea, updateIdea, convertToProject, deleteIdea } = useIdeas();

  const openEdit = (i) => { setEditing({ ...i, tags: Array.isArray(i.tags) ? i.tags.join(", ") : i.tags }); setModal(true); };
  const openCreate = () => { setEditing(null); setModal(true); };
  const handleSave = async (p) => { if (editing) await updateIdea(editing._id, p); else await createIdea(p); };
  const handleDelete = async (id) => { if (!confirm("Delete this idea?")) return; await deleteIdea(id); };
  const handleConvert = async (id) => { if (!confirm("Convert to project?")) return; await convertToProject(id); };

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div><h1 className="page-title">Idea Vault</h1><p className="text-sm text-slate-500 mt-0.5">{ideas.length} ideas</p></div>
          <Button variant="primary" onClick={openCreate}><Plus size={15} />Capture Idea</Button>
        </div>

        {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        : ideas.length === 0 ? <EmptyState icon={Lightbulb} title="Vault is empty" description="Capture your next big idea." action={<Button variant="primary" onClick={openCreate}><Plus size={15} />Capture Idea</Button>} />
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {ideas.map((idea) => (
              <div key={idea._id} className="card-hover p-5 group flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Lightbulb size={14} className="text-amber-400 shrink-0" />
                    <p className="font-semibold text-slate-200 truncate">{idea.title}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0 ml-1">
                    <button onClick={() => openEdit(idea)} className="p-1 text-slate-500 hover:text-brand"><Edit2 size={13} /></button>
                    <button onClick={() => handleDelete(idea._id)} className="p-1 text-slate-500 hover:text-danger"><Trash2 size={13} /></button>
                  </div>
                </div>
                {idea.description && <p className="text-xs text-slate-500 line-clamp-3">{idea.description}</p>}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex">{[1,2,3,4,5].map((n) => <span key={n} className={n <= idea.rating ? "text-amber-400 text-sm" : "text-slate-700 text-sm"}>★</span>)}</div>
                  <Badge className={idea.status === "converted" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400"}>{idea.status}</Badge>
                  {idea.tags?.map((t) => <Badge key={t} className="bg-surface-3 text-slate-500">#{t}</Badge>)}
                </div>
                {idea.status !== "converted" && (
                  <button onClick={() => handleConvert(idea._id)} className="flex items-center gap-1.5 text-xs text-brand hover:text-brand-light mt-auto transition-colors">
                    <ArrowRight size={12} />Convert to Project
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <IdeaModal open={modalOpen} onClose={() => setModal(false)} onSave={handleSave} initial={editing} />
    </PageWrapper>
  );
}