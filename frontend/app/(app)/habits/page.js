"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Zap, CheckCircle } from "lucide-react";
import { useHabits } from "@/hooks/useProjects";
import { Button, Badge, Spinner, EmptyState, Input, Select, Textarea } from "@/components/ui";
import Modal from "@/components/ui/Modal";
import PageWrapper from "@/components/layout/PageWrapper";
import clsx from "clsx";

const HABIT_COLORS = ["#10b981","#6366f1","#f59e0b","#ef4444","#3b82f6","#ec4899","#14b8a6","#8b5cf6"];
const HABIT_ICONS  = ["⚡","🏃","📚","💧","🧘","🎯","💪","🌱","✍️","🎵","🛌","🥗"];

function HabitModal({ open, onClose, onSave, initial }) {
  const blank = { title: "", description: "", frequency: "daily", color: HABIT_COLORS[0], icon: "⚡" };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initial || blank);
  }, [open, initial]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSave = async () => {
    if (!form.title.trim()) return;
    try { setSaving(true); await onSave(form); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Habit" : "New Habit"}>
      <div className="space-y-4">
        <Input label="Title *" value={form.title} onChange={set("title")} placeholder="e.g. Morning run" />
        <Textarea label="Description" value={form.description} onChange={set("description")} rows={2} />
        <Select label="Frequency" value={form.frequency} onChange={set("frequency")}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </Select>
        {/* Icon picker */}
        <div>
          <p className="text-xs font-medium text-slate-400 mb-2">Icon</p>
          <div className="flex flex-wrap gap-2">
            {HABIT_ICONS.map((icon) => (
              <button key={icon} onClick={() => setForm({ ...form, icon })}
                className={clsx("text-xl p-1.5 rounded-lg transition-all", form.icon === icon ? "bg-brand/20 ring-1 ring-brand" : "hover:bg-surface-2")}>
                {icon}
              </button>
            ))}
          </div>
        </div>
        {/* Color picker */}
        <div>
          <p className="text-xs font-medium text-slate-400 mb-2">Colour</p>
          <div className="flex gap-2 flex-wrap">
            {HABIT_COLORS.map((c) => (
              <button key={c} onClick={() => setForm({ ...form, color: c })}
                className={clsx("h-6 w-6 rounded-full border-2 transition-all", form.color === c ? "border-white scale-110" : "border-transparent")}
                style={{ background: c }} />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={!form.title.trim() || saving}>
            {saving ? "Saving…" : initial ? "Save Changes" : "Create Habit"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function HabitCard({ habit, onLog, onUnlog, onEdit, onDelete }) {
  const [logging, setLogging] = useState(false);

  const handleToggle = async () => {
    try {
      setLogging(true);
      if (habit.completedToday) await onUnlog(habit._id);
      else                      await onLog(habit._id);
    } finally { setLogging(false); }
  };

  return (
    <div className="card-hover p-5 group flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: habit.color + "20", border: `1px solid ${habit.color}40` }}>
            {habit.icon}
          </div>
          <div>
            <p className="font-semibold text-slate-200">{habit.title}</p>
            <p className="text-xs text-slate-500 capitalize">{habit.frequency}</p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(habit)} className="p-1 text-slate-500 hover:text-brand"><Edit2 size={13} /></button>
          <button onClick={() => onDelete(habit._id)} className="p-1 text-slate-500 hover:text-danger"><Trash2 size={13} /></button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-lg font-bold text-amber-400">{habit.currentStreak}</p>
            <p className="text-[10px] text-slate-600">streak</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-slate-400">{habit.longestStreak}</p>
            <p className="text-[10px] text-slate-600">best</p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={logging}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            habit.completedToday
              ? "bg-success/15 text-success border border-success/30"
              : "bg-surface-2 text-slate-400 hover:bg-surface-3 hover:text-slate-200 border border-surface-3"
          )}
        >
          {habit.completedToday
            ? <><CheckCircle size={14} />Done</>
            : <><Zap size={14} />Mark Done</>
          }
        </button>
      </div>
    </div>
  );
}

export default function HabitsPage() {
  const [modalOpen, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const { habits, loading, createHabit, updateHabit, logToday, unlogToday, deleteHabit } = useHabits();

  const openEdit   = (h) => { setEditing(h); setModal(true); };
  const openCreate = () =>  { setEditing(null); setModal(true); };

  const handleSave = async (payload) => {
    if (editing) await updateHabit(editing._id, payload);
    else         await createHabit(payload);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this habit? All log history will be lost.")) return;
    await deleteHabit(id);
  };

  const totalDone = habits.filter((h) => h.completedToday).length;

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Habits</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {totalDone}/{habits.length} completed today
            </p>
          </div>
          <Button variant="primary" onClick={openCreate}><Plus size={15} />New Habit</Button>
        </div>

        {/* Progress bar for today */}
        {habits.length > 0 && (
          <div className="card p-4">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>Today's progress</span>
              <span>{habits.length > 0 ? Math.round((totalDone / habits.length) * 100) : 0}%</span>
            </div>
            <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-success rounded-full transition-all duration-500"
                style={{ width: `${habits.length > 0 ? (totalDone / habits.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : habits.length === 0 ? (
          <EmptyState icon={Zap} title="No habits yet" description="Build streaks, track progress." action={<Button variant="primary" onClick={openCreate}><Plus size={15} />New Habit</Button>} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {habits.map((h) => (
              <HabitCard key={h._id} habit={h} onLog={logToday} onUnlog={unlogToday} onEdit={openEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
      <HabitModal open={modalOpen} onClose={() => setModal(false)} onSave={handleSave} initial={editing} />
    </PageWrapper>
  );
}