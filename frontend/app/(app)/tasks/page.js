"use client";

import { useState, useEffect } from "react";
import { format, isPast, isToday } from "date-fns";
import {
  LayoutList, Columns, Plus, X, Edit2, Trash2,
  CheckCircle, Circle, Calendar, Tag, ChevronDown,
  ChevronUp, ChevronRight, Folder, AlertCircle, Clock,
} from "lucide-react";
import clsx from "clsx";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import {
  Button, Badge, Spinner, EmptyState,
  Select, ProgressBar,
} from "@/components/ui";
import {
  QuickTaskInput, TaskModal, KanbanBoard,
} from "@/components/tasks/TaskComponents";
import PageWrapper from "@/components/layout/PageWrapper";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";

// ── Status stepper ────────────────────────────────────────────────────────────
function StatusStepper({ currentStatus, onMove, moving }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {TASK_STATUSES.map((s) => {
        const isActive = s.value === currentStatus;
        return (
          <button
            key={s.value}
            onClick={() => !isActive && onMove(s.value)}
            disabled={isActive || moving}
            className={clsx(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all",
              isActive
                ? "border font-medium cursor-default"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 cursor-pointer",
              moving && "opacity-50 pointer-events-none",
            )}
            style={isActive ? {
              background: "rgba(99,102,241,0.1)",
              borderColor: "rgba(99,102,241,0.3)",
              color: "#a5b4fc",
            } : {}}
          >
            <span className={clsx(
              "h-2 w-2 rounded-full shrink-0",
              isActive ? "bg-brand" : "bg-slate-700",
            )} />
            {s.label}
            {isActive && <span className="ml-auto text-[10px] opacity-60">current</span>}
          </button>
        );
      })}
    </div>
  );
}

// ── Task Detail Drawer ────────────────────────────────────────────────────────
function TaskDrawer({ task, onClose, onEdit, onDelete, onStatusChange, onToggleSubtask }) {
  const [moving, setMoving]     = useState(false);
  const [toggling, setToggling] = useState(null);

  if (!task) return null;

  const priority     = TASK_PRIORITIES.find((p) => p.value === task.priority);
  const status       = TASK_STATUSES.find((s) => s.value === task.status);
  const isDone       = task.status === "done";
  const subtasksDone = task.subtasks?.filter((s) => s.done).length || 0;
  const subtaskTotal = task.subtasks?.length || 0;

  const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;
  const duePast    = dueDateObj && !isDone && isPast(dueDateObj) && !isToday(dueDateObj);
  const dueToday   = dueDateObj && isToday(dueDateObj);

  const handleStatusMove = async (newStatus) => {
    setMoving(true);
    try { await onStatusChange(task._id, newStatus); }
    finally { setMoving(false); }
  };

  const handleSubtask = async (subtaskId) => {
    setToggling(subtaskId);
    try { await onToggleSubtask(task._id, subtaskId); }
    finally { setToggling(null); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this task?")) return;
    onClose();
    await onDelete(task._id);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full z-50 w-full max-w-lg bg-surface shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-start gap-3">
            <button
              onClick={() => handleStatusMove(isDone ? "todo" : "done")}
              className="mt-0.5 shrink-0 transition-colors"
              title={isDone ? "Mark as todo" : "Mark as done"}
            >
              {isDone
                ? <CheckCircle size={20} className="text-success" />
                : <Circle size={20} className="text-slate-500 hover:text-success" />}
            </button>
            <div className="flex-1 min-w-0">
              <h2 className={clsx("text-lg font-semibold text-slate-100 leading-snug", isDone && "line-through text-slate-500")}>
                {task.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {priority && <Badge className={priority.color}>{priority.label}</Badge>}
                {status   && <Badge className={status.color}>{status.label}</Badge>}
                {dueDateObj && (
                  <span className={clsx("text-xs flex items-center gap-1",
                    duePast ? "text-red-400" : dueToday ? "text-amber-400" : "text-slate-500")}>
                    {duePast ? <AlertCircle size={11} /> : <Calendar size={11} />}
                    {duePast ? "Overdue · " : dueToday ? "Today · " : ""}
                    {format(dueDateObj, "MMM d, yyyy")}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => { onClose(); setTimeout(() => onEdit(task), 100); }}
                className="p-2 rounded-lg text-slate-400 hover:text-brand hover:bg-white/5 transition-colors">
                <Edit2 size={15} />
              </button>
              <button onClick={handleDelete}
                className="p-2 rounded-lg text-slate-400 hover:text-danger hover:bg-danger/5 transition-colors">
                <Trash2 size={15} />
              </button>
              <button onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {task.description && (
            <section>
              <SectionLabel>Description</SectionLabel>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{task.description}</p>
            </section>
          )}
          <section className="flex flex-wrap gap-2">
            {task.projectId && (
              <InfoChip icon={<Folder size={11} />} color="text-violet-400">
                {task.projectId.title || "Project"}
              </InfoChip>
            )}
            {task.tags?.map((tag) => (
              <InfoChip key={tag} icon={<Tag size={11} />} color="text-slate-400">#{tag}</InfoChip>
            ))}
            {dueDateObj && (
              <InfoChip icon={<Clock size={11} />}
                color={duePast ? "text-red-400" : dueToday ? "text-amber-400" : "text-slate-400"}>
                Due {format(dueDateObj, "MMM d, yyyy")}
              </InfoChip>
            )}
          </section>

          {subtaskTotal > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <SectionLabel className="mb-0">Subtasks</SectionLabel>
                <span className="text-xs text-slate-500">{subtasksDone}/{subtaskTotal} done</span>
              </div>
              <div className="mb-3">
                <ProgressBar value={subtaskTotal ? (subtasksDone / subtaskTotal) * 100 : 0} />
              </div>
              <div className="space-y-1.5">
                {task.subtasks.map((sub) => (
                  <button key={sub._id} onClick={() => handleSubtask(sub._id)}
                    disabled={toggling === sub._id}
                    className={clsx("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all bg-surface-2 hover:bg-white/5",
                      toggling === sub._id && "opacity-60 pointer-events-none")}>
                    {sub.done
                      ? <CheckCircle size={15} className="text-success shrink-0" />
                      : <Circle size={15} className="text-slate-600 shrink-0" />}
                    <span className={clsx("text-sm flex-1 text-left", sub.done ? "line-through text-slate-500" : "text-slate-200")}>
                      {sub.title}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionLabel>Move to status</SectionLabel>
            <StatusStepper currentStatus={task.status} onMove={handleStatusMove} moving={moving} />
          </section>

          <section className="border-t border-white/[0.06] pt-4 text-xs text-slate-600 space-y-1">
            <p>Created {format(new Date(task.createdAt), "MMM d, yyyy · h:mm a")}</p>
            <p>Updated {format(new Date(task.updatedAt), "MMM d, yyyy · h:mm a")}</p>
          </section>
        </div>

        <div className="px-6 py-4 border-t border-white/[0.06]">
          <Button variant="primary" className="w-full"
            onClick={() => { onClose(); setTimeout(() => onEdit(task), 100); }}>
            <Edit2 size={14} /> Edit Task
          </Button>
        </div>
      </div>
    </>
  );
}

function SectionLabel({ children, className = "mb-2" }) {
  return <p className={clsx("text-xs font-medium text-slate-500 uppercase tracking-wider", className)}>{children}</p>;
}
function InfoChip({ icon, children, color = "text-slate-400" }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-2 text-xs", color)}>
      {icon}{children}
    </span>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, onView, onEdit, onDelete, onStatusChange, onToggleSubtask, compact = false }) {
  const [expanded, setExpanded] = useState(false);
  const priority     = TASK_PRIORITIES.find((p) => p.value === task.priority);
  const status       = TASK_STATUSES.find((s) => s.value === task.status);
  const isDone       = task.status === "done";
  const subtasksDone = task.subtasks?.filter((s) => s.done).length || 0;
  const subtaskTotal = task.subtasks?.length || 0;
  const dueDateObj   = task.dueDate ? new Date(task.dueDate) : null;
  const duePast      = dueDateObj && !isDone && isPast(dueDateObj) && !isToday(dueDateObj);
  const dueToday     = dueDateObj && isToday(dueDateObj);

  return (
    <div
      className={clsx("card-hover p-4 group relative", isDone && "opacity-60", !compact && "cursor-pointer")}
      onClick={!compact ? () => onView(task) : undefined}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={(e) => { e.stopPropagation(); onStatusChange?.(task._id, isDone ? "todo" : "done"); }}
          className="mt-0.5 text-slate-500 hover:text-success transition-colors shrink-0"
        >
          {isDone ? <CheckCircle size={16} className="text-success" /> : <Circle size={16} />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={clsx("text-sm font-medium text-slate-200 truncate", isDone && "line-through")}>{task.title}</p>
          {!compact && (
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {priority && <Badge className={priority.color}>{priority.label}</Badge>}
              {status   && <Badge className={status.color}>{status.label}</Badge>}
              {dueDateObj && (
                <span className={clsx("flex items-center gap-1 text-xs",
                  duePast ? "text-red-400" : dueToday ? "text-amber-400" : "text-slate-500")}>
                  {duePast && <AlertCircle size={9} />}
                  <Calendar size={9} />
                  {format(dueDateObj, "MMM d")}
                </span>
              )}
              {task.tags?.map((tag) => (
                <span key={tag} className="flex items-center gap-1 text-xs text-slate-600">
                  <Tag size={9} />#{tag}
                </span>
              ))}
            </div>
          )}
          {subtaskTotal > 0 && !compact && (
            <div className="mt-2">
              <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300">
                {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                {subtasksDone}/{subtaskTotal} subtasks
              </button>
              {expanded && (
                <ul className="mt-2 space-y-1 pl-2 border-l border-surface-3">
                  {task.subtasks.map((sub) => (
                    <li key={sub._id}
                      className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-slate-200"
                      onClick={(e) => { e.stopPropagation(); onToggleSubtask?.(task._id, sub._id); }}>
                      {sub.done ? <CheckCircle size={11} className="text-success shrink-0" /> : <Circle size={11} className="shrink-0" />}
                      <span className={sub.done ? "line-through text-slate-600" : ""}>{sub.title}</span>
                    </li>
                  ))}
                </ul>
              )}
              <ProgressBar value={subtaskTotal ? (subtasksDone / subtaskTotal) * 100 : 0} className="mt-2" />
            </div>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onEdit?.(task)} className="p-1.5 rounded-md text-slate-500 hover:text-brand hover:bg-white/5">
            <Edit2 size={13} />
          </button>
          <button onClick={() => onDelete?.(task._id)} className="p-1.5 rounded-md text-slate-500 hover:text-danger hover:bg-danger/5">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {!compact && (
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="text-[10px] text-slate-600 flex items-center gap-0.5">View <ChevronRight size={9} /></span>
        </div>
      )}
    </div>
  );
}

function TaskListView({ tasks, onView, onEdit, onDelete, onStatusChange, onToggleSubtask }) {
  if (!tasks.length) return <div className="text-center py-16 text-slate-500 text-sm">No tasks found</div>;
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskCard key={task._id} task={task} onView={onView} onEdit={onEdit}
          onDelete={onDelete} onStatusChange={onStatusChange} onToggleSubtask={onToggleSubtask} />
      ))}
    </div>
  );
}

function KanbanView({ tasks, onEdit, onDelete, onStatusChange, onToggleSubtask }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {TASK_STATUSES.map(({ value, label, color }) => {
        const col = tasks.filter((t) => t.status === value);
        return (
          <div key={value} className="flex flex-col gap-2 min-h-[400px]">
            <div className="flex items-center justify-between px-1">
              <Badge className={color}>{label}</Badge>
              <span className="text-xs text-slate-600">{col.length}</span>
            </div>
            <div className="flex-1 space-y-2 bg-surface-2/40 rounded-xl p-2 border border-surface-3">
              {col.map((task) => (
                <TaskCard key={task._id} task={task} compact onEdit={onEdit}
                  onDelete={onDelete} onStatusChange={onStatusChange} onToggleSubtask={onToggleSubtask} />
              ))}
              {col.length === 0 && <p className="text-xs text-slate-600 text-center py-8">Empty</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const [view, setView]       = useState("list");
  const [filters, setFilters] = useState({ status: "", priority: "" });
  const [modalOpen, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);

  const { tasks, loading, createTask, updateTask, patchStatus, toggleSubtask, deleteTask } = useTasks(filters);
  const { projects } = useProjects();

  const openCreate = () => { setEditing(null); setModal(true); };
  const openEdit   = (task) => {
    setEditing({
      ...task,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      tags: Array.isArray(task.tags) ? task.tags.join(", ") : "",
      // FIX: projectId may be a populated object — extract the id string
      projectId: task.projectId?._id || task.projectId || "",
    });
    setModal(true);
  };
  const openView = (task) => setViewing(task);

  // Keep drawer in sync after mutations
  useEffect(() => {
    if (!viewing) return;
    const fresh = tasks.find((t) => t._id === viewing._id);
    if (fresh) setViewing(fresh);
  }, [tasks]);

  const handleSave = async (payload) => {
    if (editing) await updateTask(editing._id, payload);
    else         await createTask(payload);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this task?")) return;
    if (viewing?._id === id) setViewing(null);
    await deleteTask(id);
  };

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="page-title">Tasks</h1>
            <p className="text-sm text-slate-500 mt-0.5">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-surface-2 rounded-lg p-1 gap-1">
              <button onClick={() => setView("list")}
                className={clsx("p-1.5 rounded-md transition-colors",
                  view === "list" ? "bg-surface-3 text-slate-100" : "text-slate-500 hover:text-slate-300")}
                title="List view"><LayoutList size={15} /></button>
              <button onClick={() => setView("kanban")}
                className={clsx("p-1.5 rounded-md transition-colors",
                  view === "kanban" ? "bg-surface-3 text-slate-100" : "text-slate-500 hover:text-slate-300")}
                title="Kanban view"><Columns size={15} /></button>
            </div>
            <Button variant="primary" onClick={openCreate}><Plus size={15} /> New Task</Button>
          </div>
        </div>

        <QuickTaskInput onCreate={createTask} />

        <div className="flex gap-3 flex-wrap">
          <Select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="w-36 text-sm">
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </Select>
          <Select value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))} className="w-36 text-sm">
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : view === "list" ? (
          <TaskListView tasks={tasks} onView={openView} onEdit={openEdit}
            onDelete={handleDelete} onStatusChange={patchStatus} onToggleSubtask={toggleSubtask} />
        ) : (
          <KanbanView tasks={tasks} onEdit={openEdit} onDelete={handleDelete}
            onStatusChange={patchStatus} onToggleSubtask={toggleSubtask} />
        )}
      </div>

      {viewing && (
        <TaskDrawer task={viewing} onClose={() => setViewing(null)} onEdit={openEdit}
          onDelete={handleDelete} onStatusChange={patchStatus} onToggleSubtask={toggleSubtask} />
      )}

      <TaskModal open={modalOpen} onClose={() => setModal(false)} onSave={handleSave}
        initial={editing} projects={projects} />
    </PageWrapper>
  );
}