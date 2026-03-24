"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Plus, Trash2, Edit2, TrendingUp, TrendingDown,
  Wallet, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useBudget } from "@/hooks/useBudget";
import {
  Button, Badge, Spinner, EmptyState,
  Input, Select, Textarea,
} from "@/components/ui";
import Modal from "@/components/ui/Modal";
import PageWrapper from "@/components/layout/PageWrapper";
import clsx from "clsx";

const CATEGORIES = [
  "food", "transport", "housing", "utilities", "entertainment",
  "health", "education", "shopping", "salary", "freelance",
  "investment", "other",
];

const CAT_ICONS = {
  food: "🍔", transport: "🚗", housing: "🏠", utilities: "⚡",
  entertainment: "🎬", health: "💊", education: "📚", shopping: "🛍️",
  salary: "💼", freelance: "💻", investment: "📈", other: "📦",
};

// ── Budget Entry Modal ────────────────────────────────────────────────────────
function BudgetModal({ open, onClose, onSave, initial }) {
  const today = new Date().toISOString().slice(0, 10);
  const blank = { title: "", amount: "", type: "expense", category: "other", date: today, notes: "" };

  const [form, setForm]     = useState(blank);
  const [saving, setSaving] = useState(false);

  // FIX: reset form every time modal opens — prevents stale data from last entry
  useEffect(() => {
    if (open) {
      setForm(initial
        ? { ...initial, amount: String(initial.amount), date: initial.date ? new Date(initial.date).toISOString().slice(0, 10) : today }
        : blank
      );
    }
  }, [open, initial]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.amount) return;
    try {
      setSaving(true);
      await onSave({ ...form, amount: parseFloat(form.amount) });
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Entry" : "Add Entry"}>
      <div className="space-y-4">

        {/* Income / Expense toggle */}
        <div className="grid grid-cols-2 gap-2">
          {["income", "expense"].map((t) => (
            <button key={t} onClick={() => setForm((f) => ({ ...f, type: t }))}
              className={clsx(
                "py-3 rounded-xl text-sm font-semibold capitalize transition-all",
                form.type === t
                  ? t === "income"
                    ? "bg-success/20 text-success ring-1 ring-success/40"
                    : "bg-danger/20 text-danger ring-1 ring-danger/40"
                  : "bg-surface-2 text-slate-400 hover:bg-surface-3"
              )}>
              {t === "income" ? "💰 Income" : "💸 Expense"}
            </button>
          ))}
        </div>

        <Input label="Title *" value={form.title} onChange={set("title")} placeholder="e.g. Grocery shopping" />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Amount (₹) *" type="number" min="0" step="0.01"
            value={form.amount} onChange={set("amount")} placeholder="0.00" />
          <Input label="Date" type="date" value={form.date} onChange={set("date")} />
        </div>

        <Select label="Category" value={form.category} onChange={set("category")}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </Select>

        <Textarea label="Notes" value={form.notes} onChange={set("notes")} rows={2} placeholder="Optional notes…" />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}
            disabled={!form.title.trim() || !form.amount || saving}>
            {saving ? "Saving…" : initial ? "Save Changes" : "Add Entry"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Summary Cards ─────────────────────────────────────────────────────────────
function SummaryCards({ summary }) {
  const { income = 0, expense = 0, balance = 0 } = summary;
  const isPositive = balance >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Income */}
      <div className="card p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
          <TrendingUp size={17} className="text-success" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">Income</p>
          <p className="text-lg font-bold text-success truncate">
            +₹{income.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Expense */}
      <div className="card p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-danger/10 flex items-center justify-center shrink-0">
          <TrendingDown size={17} className="text-danger" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">Expenses</p>
          <p className="text-lg font-bold text-danger truncate">
            -₹{expense.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Balance */}
      <div className={clsx("card p-4 flex items-center gap-3 border", isPositive ? "border-success/20 bg-success/5" : "border-danger/20 bg-danger/5")}>
        <div className={clsx("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", isPositive ? "bg-success/10" : "bg-danger/10")}>
          <Wallet size={17} className={isPositive ? "text-success" : "text-danger"} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">Balance</p>
          <p className={clsx("text-lg font-bold truncate", isPositive ? "text-success" : "text-danger")}>
            {isPositive ? "+" : "-"}₹{Math.abs(balance).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Entry Row ─────────────────────────────────────────────────────────────────
function EntryRow({ entry, onEdit, onDelete }) {
  const isIncome = entry.type === "income";
  const icon     = CAT_ICONS[entry.category] || "📦";

  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-2 transition-colors group">
      {/* Category icon */}
      <div className={clsx(
        "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 text-base",
        isIncome ? "bg-success/10" : "bg-danger/10"
      )}>
        {icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">{entry.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <Badge className="bg-surface-3 text-slate-500 text-[10px] capitalize">{entry.category}</Badge>
          <span className="text-[11px] text-slate-600">
            {format(new Date(entry.date), "MMM d")}
          </span>
          {entry.notes && (
            <span className="text-[11px] text-slate-600 truncate max-w-[120px]">{entry.notes}</span>
          )}
        </div>
      </div>

      {/* Amount */}
      <p className={clsx("text-sm font-bold shrink-0", isIncome ? "text-success" : "text-danger")}>
        {isIncome ? "+" : "-"}₹{Number(entry.amount).toLocaleString("en-IN")}
      </p>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity shrink-0">
        <button onClick={() => onEdit(entry)} className="p-1.5 text-slate-600 hover:text-brand rounded-lg hover:bg-white/5">
          <Edit2 size={13} />
        </button>
        <button onClick={() => onDelete(entry._id)} className="p-1.5 text-slate-600 hover:text-danger rounded-lg hover:bg-danger/5">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Month Navigator ───────────────────────────────────────────────────────────
function MonthNav({ month, onChange }) {
  const [y, m] = month.split("-").map(Number);

  const prev = () => {
    const d = new Date(y, m - 2, 1);
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };
  const next = () => {
    const d = new Date(y, m, 1);
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const label = new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const isCurrentMonth = month === new Date().toISOString().slice(0, 7);

  return (
    <div className="flex items-center gap-1 bg-surface-2 rounded-xl px-1 py-1">
      <button onClick={prev} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-surface-3 transition-colors">
        <ChevronLeft size={15} />
      </button>
      <span className="text-sm font-medium text-slate-300 px-2 min-w-[140px] text-center">{label}</span>
      <button onClick={next} disabled={isCurrentMonth}
        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-surface-3 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BudgetPage() {
  const [modalOpen, setModal]   = useState(false);
  const [editing, setEditing]   = useState(null);
  const [filterType, setFilter] = useState("");
  const [month, setMonth]       = useState(new Date().toISOString().slice(0, 7));

  const { entries, summary, loading, createEntry, updateEntry, deleteEntry } =
    useBudget({ month });

  const filtered = filterType ? entries.filter((e) => e.type === filterType) : entries;

  const openEdit   = (e) => { setEditing(e); setModal(true); };
  const openCreate = () =>  { setEditing(null); setModal(true); };

  const handleSave = async (payload) => {
    if (editing) await updateEntry(editing._id, payload);
    else         await createEntry(payload);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this entry?")) return;
    await deleteEntry(id);
  };

  // Spend percentage for the progress bar
  const spendPct   = summary.income > 0 ? Math.min(100, Math.round((summary.expense / summary.income) * 100)) : 0;
  const barColor   = spendPct > 90 ? "bg-danger" : spendPct > 70 ? "bg-warning" : "bg-success";

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="page-title">Budget</h1>
            <p className="text-sm text-slate-500 mt-0.5">{entries.length} entries this month</p>
          </div>
          {/* Month nav + Add — stack on mobile */}
          <div className="flex items-center gap-2 flex-wrap">
            <MonthNav month={month} onChange={setMonth} />
            <Button variant="primary" onClick={openCreate}>
              <Plus size={15} /> Add
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <SummaryCards summary={summary} />

        {/* Spend bar */}
        {summary.income > 0 && (
          <div className="card px-4 py-3">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>Spent of income</span>
              <span className={spendPct > 90 ? "text-danger font-semibold" : ""}>{spendPct}%</span>
            </div>
            <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
              <div className={clsx("h-full rounded-full transition-all duration-700", barColor)}
                style={{ width: `${spendPct}%` }} />
            </div>
          </div>
        )}

        {/* Category breakdown */}
        {summary.categoryBreakdown?.length > 0 && (
          <div className="card p-4">
            <p className="text-sm font-semibold text-slate-200 mb-3">Expense Breakdown</p>
            <div className="space-y-2.5">
              {summary.categoryBreakdown.slice(0, 6).map((cat) => {
                const pct = summary.expense > 0 ? Math.round((cat.total / summary.expense) * 100) : 0;
                return (
                  <div key={cat._id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 capitalize flex items-center gap-1.5">
                        {CAT_ICONS[cat._id] || "📦"} {cat._id}
                      </span>
                      <span className="text-slate-500">₹{cat.total.toLocaleString("en-IN")} · {pct}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                      <div className="h-full bg-brand rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2">
          {[
            { value: "",        label: `All (${entries.length})` },
            { value: "income",  label: `Income (${entries.filter(e => e.type === "income").length})` },
            { value: "expense", label: `Expenses (${entries.filter(e => e.type === "expense").length})` },
          ].map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                filterType === f.value
                  ? "bg-brand/15 text-brand"
                  : "text-slate-400 hover:text-slate-200 hover:bg-surface-2"
              )}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Entries */}
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Wallet} title="No entries"
            description={filterType ? "No entries match this filter." : "Start tracking income and expenses."}
            action={<Button variant="primary" onClick={openCreate}><Plus size={15} /> Add Entry</Button>}
          />
        ) : (
          <div className="card p-2 space-y-0.5">
            {filtered.map((entry) => (
              <EntryRow key={entry._id} entry={entry} onEdit={openEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      <BudgetModal open={modalOpen} onClose={() => setModal(false)}
        onSave={handleSave} initial={editing} />
    </PageWrapper>
  );
}