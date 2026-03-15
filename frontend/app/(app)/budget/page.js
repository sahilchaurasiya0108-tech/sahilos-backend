"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Plus, Trash2, Edit2, TrendingUp, TrendingDown,
  Wallet, DollarSign,
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

// ── Budget Entry Modal ────────────────────────────────────────────────────────
function BudgetModal({ open, onClose, onSave, initial }) {
  const today = new Date().toISOString().slice(0, 10);
  const blank = {
    title: "", amount: "", type: "expense",
    category: "other", date: today, notes: "",
  };
  const [form, setForm] = useState(initial || blank);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSave = async () => {
    if (!form.title.trim() || !form.amount) return;
    try {
      setSaving(true);
      await onSave({ ...form, amount: parseFloat(form.amount) });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit Entry" : "Add Entry"}
    >
      <div className="space-y-4">
        {/* Income / Expense toggle */}
        <div>
          <p className="text-xs font-medium text-slate-400 mb-2">Type</p>
          <div className="grid grid-cols-2 gap-2">
            {["income", "expense"].map((t) => (
              <button
                key={t}
                onClick={() => setForm({ ...form, type: t })}
                className={clsx(
                  "py-2.5 rounded-lg text-sm font-semibold capitalize transition-all",
                  form.type === t
                    ? t === "income"
                      ? "bg-success/20 text-success ring-1 ring-success/40"
                      : "bg-danger/20 text-danger ring-1 ring-danger/40"
                    : "bg-surface-2 text-slate-400 hover:bg-surface-3"
                )}
              >
                {t === "income" ? "💰 Income" : "💸 Expense"}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Title *"
          value={form.title}
          onChange={set("title")}
          placeholder="e.g. Grocery shopping"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount (₹) *"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={set("amount")}
            placeholder="0.00"
          />
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={set("date")}
          />
        </div>

        <Select label="Category" value={form.category} onChange={set("category")}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </Select>

        <Textarea
          label="Notes"
          value={form.notes}
          onChange={set("notes")}
          rows={2}
          placeholder="Optional notes…"
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!form.title.trim() || !form.amount || saving}
          >
            {saving ? "Saving…" : initial ? "Save Changes" : "Add Entry"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Summary Card ──────────────────────────────────────────────────────────────
function SummaryCard({ label, amount, icon: Icon, color, bg }) {
  return (
    <div className={clsx("card p-5 flex items-center gap-4", bg)}>
      <div className={clsx("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", color)}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-slate-100">
          ₹{Math.abs(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
}

// ── Entry Row ─────────────────────────────────────────────────────────────────
function EntryRow({ entry, onEdit, onDelete }) {
  const isIncome = entry.type === "income";

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-surface-2 transition-colors group">
      <div
        className={clsx(
          "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 text-sm",
          isIncome ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
        )}
      >
        {isIncome ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">{entry.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge className="bg-surface-3 text-slate-500 capitalize">{entry.category}</Badge>
          <span className="text-xs text-slate-600">
            {format(new Date(entry.date), "MMM d, yyyy")}
          </span>
        </div>
      </div>

      <p className={clsx(
        "text-sm font-semibold shrink-0",
        isIncome ? "text-success" : "text-danger"
      )}>
        {isIncome ? "+" : "-"}₹{Number(entry.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
      </p>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onEdit(entry)}
          className="p-1 text-slate-500 hover:text-brand rounded"
        >
          <Edit2 size={13} />
        </button>
        <button
          onClick={() => onDelete(entry._id)}
          className="p-1 text-slate-500 hover:text-danger rounded"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BudgetPage() {
  const [modalOpen, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterType, setFilterType] = useState("");

  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);

  const { entries, summary, loading, createEntry, updateEntry, deleteEntry } =
    useBudget(month ? { month } : {});

  const filtered = filterType ? entries.filter((e) => e.type === filterType) : entries;

  const openEdit   = (e) => {
    setEditing({ ...e, date: e.date ? new Date(e.date).toISOString().slice(0, 10) : "" });
    setModal(true);
  };
  const openCreate = () => { setEditing(null); setModal(true); };

  const handleSave = async (payload) => {
    if (editing) await updateEntry(editing._id, payload);
    else         await createEntry(payload);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this entry?")) return;
    await deleteEntry(id);
  };

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="page-title">Budget</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Track income and expenses
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="input-base w-40 text-sm"
            />
            <Button variant="primary" onClick={openCreate}>
              <Plus size={15} /> Add Entry
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            label="Total Income"
            amount={summary.income}
            icon={TrendingUp}
            color="bg-success/10 text-success"
          />
          <SummaryCard
            label="Total Expenses"
            amount={summary.expense}
            icon={TrendingDown}
            color="bg-danger/10 text-danger"
          />
          <SummaryCard
            label="Balance"
            amount={summary.balance}
            icon={Wallet}
            color={summary.balance >= 0 ? "bg-brand/10 text-brand" : "bg-warning/10 text-warning"}
          />
        </div>

        {/* Category breakdown */}
        {summary.categoryBreakdown?.length > 0 && (
          <div className="card p-5">
            <p className="text-sm font-semibold text-slate-200 mb-3">Expense Breakdown</p>
            <div className="space-y-2">
              {summary.categoryBreakdown.slice(0, 6).map((cat) => {
                const pct = summary.expense > 0
                  ? Math.round((cat.total / summary.expense) * 100)
                  : 0;
                return (
                  <div key={cat._id}>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span className="capitalize">{cat._id}</span>
                      <span>₹{cat.total.toLocaleString("en-IN")} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
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
            { value: "",        label: "All" },
            { value: "income",  label: "Income" },
            { value: "expense", label: "Expenses" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterType(f.value)}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                filterType === f.value
                  ? "bg-brand/15 text-brand"
                  : "text-slate-400 hover:text-slate-200 hover:bg-surface-2"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Entries list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No entries yet"
            description="Start tracking your income and expenses."
            action={
              <Button variant="primary" onClick={openCreate}>
                <Plus size={15} /> Add Entry
              </Button>
            }
          />
        ) : (
          <div className="card p-2 space-y-1">
            {filtered.map((entry) => (
              <EntryRow
                key={entry._id}
                entry={entry}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <BudgetModal
        open={modalOpen}
        onClose={() => setModal(false)}
        onSave={handleSave}
        initial={editing}
      />
    </PageWrapper>
  );
}
