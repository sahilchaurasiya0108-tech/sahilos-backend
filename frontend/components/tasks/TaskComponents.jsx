"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Calendar, Tag, Trash2, Edit2, CheckCircle,
  Circle, ChevronDown, ChevronUp, Plus,
} from "lucide-react";
import clsx from "clsx";
import { Badge, Button, ProgressBar, Input, Select, Textarea } from "@/components/ui";
import Modal from "@/components/ui/Modal";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";

// ─────────────────────────────────────────────────────────────────────────────
// TaskCard
// ─────────────────────────────────────────────────────────────────────────────
export function TaskCard({ task, onEdit, onDelete, onStatusChange, onToggleSubtask, compact = false }) {
  const [expanded, setExpanded] = useState(false);

  const priority = TASK_PRIORITIES.find((p) => p.value === task.priority);
  const status   = TASK_STATUSES.find((s)   => s.value === task.status);
  const isDone   = task.status === "done";
  const subtasksDone = task.subtasks?.filter((s) => s.done).length || 0;

  return (
    <div className={clsx("card-hover p-4 group cursor-pointer", isDone && "opacity-60")}>
      <div className="flex items-start gap-3">
        {/* Status toggle */}
        <button
          onClick={() => onStatusChange?.(task._id, isDone ? "todo" : "done")}
          className="mt-0.5 text-slate-500 hover:text-success transition-colors shrink-0"
        >
          {isDone
            ? <CheckCircle size={16} className="text-success" />
            : <Circle size={16} />
          }
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={clsx("text-sm font-medium text-slate-200 truncate", isDone && "line-through")}>
            {task.title}
          </p>

          {!compact && (
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {priority && (
                <Badge className={priority.color}>{priority.label}</Badge>
              )}
              {status && (
                <Badge className={status.color}>{status.label}</Badge>
              )}
              {task.dueDate && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Calendar size={10} />
                  {format(new Date(task.dueDate), "MMM d")}
                </span>
              )}
              {task.tags?.map((tag) => (
                <span key={tag} className="flex items-center gap-1 text-xs text-slate-600">
                  <Tag size={9} />#{tag}
                </span>
              ))}
            </div>
          )}

          {/* Subtasks */}
          {task.subtasks?.length > 0 && !compact && (
            <div className="mt-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300"
              >
                {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                {subtasksDone}/{task.subtasks.length} subtasks
              </button>
              {expanded && (
                <ul className="mt-2 space-y-1 pl-2 border-l border-surface-3">
                  {task.subtasks.map((sub) => (
                    <li
                      key={sub._id}
                      className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-slate-200"
                      onClick={() => onToggleSubtask?.(task._id, sub._id)}
                    >
                      {sub.done
                        ? <CheckCircle size={11} className="text-success shrink-0" />
                        : <Circle size={11} className="shrink-0" />
                      }
                      <span className={sub.done ? "line-through text-slate-600" : ""}>{sub.title}</span>
                    </li>
                  ))}
                </ul>
              )}
              <ProgressBar
                value={task.subtasks.length ? (subtasksDone / task.subtasks.length) * 100 : 0}
                className="mt-2"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => onEdit?.(task)} className="p-1 text-slate-500 hover:text-brand rounded">
            <Edit2 size={13} />
          </button>
          <button onClick={() => onDelete?.(task._id)} className="p-1 text-slate-500 hover:text-danger rounded">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Task Input
// ─────────────────────────────────────────────────────────────────────────────
export function QuickTaskInput({ onCreate }) {
  const [value, setValue]   = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    try {
      setLoading(true);
      await onCreate({ title: value.trim() });
      setValue("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        className="input-base flex-1"
        placeholder="Quick add task… press Enter"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={loading}
      />
      <Button type="submit" variant="primary" disabled={!value.trim() || loading}>
        <Plus size={15} />
        Add
      </Button>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Task Modal (Create / Edit)
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_TASK = {
  title: "", description: "", priority: "medium",
  status: "todo", dueDate: "", tags: "", projectId: "",
  subtasks: [],
};

export function TaskModal({ open, onClose, onSave, initial = null, projects = [] }) {
  const [form, setForm]         = useState(initial || EMPTY_TASK);
  const [subtaskInput, setSubtaskInput] = useState("");
  const [saving, setSaving]     = useState(false);
  const isEdit = !!initial;

  // Reset form when modal opens
  useEffect(() => { if (open) setForm(initial || EMPTY_TASK); }, [open]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const addSubtask = () => {
    if (!subtaskInput.trim()) return;
    setForm({ ...form, subtasks: [...(form.subtasks || []), { title: subtaskInput.trim(), done: false }] });
    setSubtaskInput("");
  };

  const removeSubtask = (idx) =>
    setForm({ ...form, subtasks: form.subtasks.filter((_, i) => i !== idx) });

  const handleSave = async () => {
    if (!form.title.trim()) return;
    try {
      setSaving(true);
      const payload = {
        ...form,
        tags: typeof form.tags === "string"
          ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : form.tags,
        dueDate: form.dueDate || null,
        projectId: form.projectId || null,
      };
      await onSave(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Task" : "New Task"} size="md">
      <div className="space-y-4">
        <Input label="Title *" value={form.title} onChange={set("title")} placeholder="Task title" />
        <Textarea label="Description" value={form.description} onChange={set("description")} rows={3} placeholder="Optional details…" />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Priority" value={form.priority} onChange={set("priority")}>
            {TASK_PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </Select>
          <Select label="Status" value={form.status} onChange={set("status")}>
            {TASK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Due Date" type="date" value={form.dueDate || ""} onChange={set("dueDate")} />
          <Select label="Project" value={form.projectId || ""} onChange={set("projectId")}>
            <option value="">No project</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
          </Select>
        </div>

        <Input label="Tags (comma separated)" value={Array.isArray(form.tags) ? form.tags.join(", ") : form.tags} onChange={set("tags")} placeholder="work, urgent, personal" />

        {/* Subtasks */}
        <div>
          <p className="text-xs font-medium text-slate-400 mb-2">Subtasks</p>
          <div className="flex gap-2 mb-2">
            <input
              className="input-base flex-1 text-sm"
              placeholder="Add subtask…"
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSubtask())}
            />
            <Button variant="outline" size="sm" onClick={addSubtask}><Plus size={13} /></Button>
          </div>
          {form.subtasks?.length > 0 && (
            <ul className="space-y-1">
              {form.subtasks.map((sub, i) => (
                <li key={i} className="flex items-center justify-between bg-surface-2 rounded-lg px-3 py-1.5 text-sm text-slate-300">
                  <span>{sub.title}</span>
                  <button onClick={() => removeSubtask(i)} className="text-slate-600 hover:text-danger ml-2"><Trash2 size={12} /></button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={!form.title.trim() || saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Task"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Task List View
// ─────────────────────────────────────────────────────────────────────────────
export function TaskList({ tasks, onEdit, onDelete, onStatusChange, onToggleSubtask }) {
  if (!tasks.length) return (
    <div className="text-center py-16 text-slate-500 text-sm">No tasks found</div>
  );
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskCard
          key={task._id}
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onToggleSubtask={onToggleSubtask}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Kanban Board
// ─────────────────────────────────────────────────────────────────────────────
export function KanbanBoard({ tasks, onEdit, onDelete, onStatusChange, onToggleSubtask }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 kanban-scroll">
      {TASK_STATUSES.map(({ value, label, color }) => {
        const col = tasks.filter((t) => t.status === value);
        return (
          <div key={value} className="flex flex-col gap-2 min-h-[400px]">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-current" />
                <Badge className={color}>{label}</Badge>
              </div>
              <span className="text-xs text-slate-600">{col.length}</span>
            </div>
            <div className="flex-1 space-y-2 bg-surface-2/40 rounded-xl p-2 border border-surface-3">
              {col.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  compact
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onStatusChange={onStatusChange}
                  onToggleSubtask={onToggleSubtask}
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
  );
}
