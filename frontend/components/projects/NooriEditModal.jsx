"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, CheckCircle, Circle } from "lucide-react";
import { PROJECT_STATUSES, PROJECT_CATEGORIES } from "@/lib/constants";
import clsx from "clsx";

// ─── Palette ─────────────────────────────────────────────────────────────────
const N = {
  void:       "#0d0810",
  deep:       "#180d1c",
  bloom:      "#7c2d9e",
  petal:      "rgb(221,160,221)",
  rose:       "rgb(242,196,232)",
  gold:       "rgb(232,192,122)",
  border:     "rgba(221,160,221,0.12)",
  borderHot:  "rgba(221,160,221,0.28)",
  inputBg:    "rgba(221,160,221,0.04)",
};

// ─── Shared field label ───────────────────────────────────────────────────────
function NLabel({ children }) {
  return (
    <p style={{
      fontFamily: "'Times New Roman', serif",
      fontStyle: "italic",
      fontSize: "0.65rem",
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: "rgba(221,160,221,0.55)",
      marginBottom: "0.45rem",
    }}>
      {children}
    </p>
  );
}

// ─── Styled input ─────────────────────────────────────────────────────────────
function NInput({ value, onChange, placeholder, autoFocus, style = {} }) {
  return (
    <input
      autoFocus={autoFocus}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: "100%",
        background: N.inputBg,
        border: `1px solid ${N.border}`,
        borderRadius: "0.75rem",
        padding: "0.65rem 1rem",
        fontFamily: "'Caveat', cursive",
        fontSize: "1.05rem",
        color: N.rose,
        outline: "none",
        transition: "border-color 0.2s ease",
        caretColor: N.gold,
        ...style,
      }}
      onFocus={(e)  => e.currentTarget.style.borderColor = N.borderHot}
      onBlur={(e)   => e.currentTarget.style.borderColor = N.border}
    />
  );
}

// ─── Styled textarea ──────────────────────────────────────────────────────────
function NTextarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%",
        background: N.inputBg,
        border: `1px solid ${N.border}`,
        borderRadius: "0.75rem",
        padding: "0.65rem 1rem",
        fontFamily: "'Caveat', cursive",
        fontSize: "1.05rem",
        color: N.rose,
        outline: "none",
        resize: "none",
        transition: "border-color 0.2s ease",
        caretColor: N.gold,
        lineHeight: 1.7,
      }}
      onFocus={(e)  => e.currentTarget.style.borderColor = N.borderHot}
      onBlur={(e)   => e.currentTarget.style.borderColor = N.border}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function NooriEditModal({ open, onClose, onSave, initial }) {
  const blank = {
    title: "", description: "", status: "active",
    repoLink: "", liveUrl: "", notes: "",
    milestones: [], categories: [],
  };

  const [form,    setForm]    = useState(blank);
  const [msInput, setMs]      = useState("");
  const [saving,  setSaving]  = useState(false);
  const msRef = useRef(null);

  useEffect(() => {
    if (open) setForm(initial ? { ...initial } : blank);
  }, [open, initial]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setV = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addMilestone = () => {
    if (!msInput.trim()) return;
    setForm((f) => ({
      ...f,
      milestones: [...(f.milestones || []), { title: msInput.trim(), done: false }],
    }));
    setMs("");
    setTimeout(() => msRef.current?.focus(), 30);
  };

  const removeMilestone = (i) =>
    setForm((f) => ({ ...f, milestones: f.milestones.filter((_, j) => j !== i) }));

  const toggleCategory = (val) =>
    setForm((f) => ({
      ...f,
      categories: f.categories?.includes(val)
        ? f.categories.filter((c) => c !== val)
        : [...(f.categories || []), val],
    }));

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try { await onSave(form); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50"
            style={{ background: "radial-gradient(ellipse at 40% 30%, rgba(124,45,158,0.18) 0%, rgba(0,0,0,0.78) 100%)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-lg pointer-events-auto flex flex-col"
              style={{
                background: "linear-gradient(165deg, #180d1c 0%, #120910 55%, #0d0810 100%)",
                border: "1px solid rgba(221,160,221,0.13)",
                borderRadius: "1.5rem",
                boxShadow: "0 0 0 1px rgba(221,160,221,0.05), 0 24px 80px rgba(0,0,0,0.7), 0 0 60px rgba(124,45,158,0.14)",
                maxHeight: "90vh",
                overflow: "hidden",
              }}
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Ambient glow */}
              <div className="absolute -top-20 -right-20 w-64 h-64 pointer-events-none rounded-full"
                style={{ background: "radial-gradient(circle, rgba(124,45,158,0.16) 0%, transparent 65%)", filter: "blur(40px)" }} />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 pointer-events-none rounded-full"
                style={{ background: "radial-gradient(circle, rgba(232,192,122,0.06) 0%, transparent 65%)", filter: "blur(36px)" }} />

              {/* Header */}
              <div className="relative flex items-start gap-3 px-6 pt-6 pb-4 shrink-0"
                style={{ borderBottom: "1px solid rgba(221,160,221,0.08)" }}>
                <motion.span
                  animate={{ y: [0, -4, 0], rotate: [0, 6, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="text-xl mt-0.5 select-none shrink-0">
                  🌙
                </motion.span>
                <div className="flex-1 min-w-0">
                  <h2 style={{
                    fontFamily: "'Dancing Script', cursive",
                    fontSize: "1.55rem",
                    fontWeight: 700,
                    background: "linear-gradient(125deg, rgb(232,192,122) 0%, rgb(242,196,232) 50%, rgb(221,160,221) 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "transparent",
                    lineHeight: 1.2,
                  }}>
                    {initial ? "edit noori" : "create noori"}
                  </h2>
                  <p style={{
                    fontFamily: "'Times New Roman', serif",
                    fontStyle: "italic",
                    fontSize: "0.65rem",
                    color: "rgba(221,160,221,0.45)",
                    letterSpacing: "0.14em",
                    marginTop: "0.25rem",
                  }}>
                    ✦ a universe, just for her ✦
                  </p>
                </div>
                <button onClick={onClose}
                  className="p-1.5 rounded-xl transition-all shrink-0"
                  style={{ color: "rgba(221,160,221,0.40)" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = N.rose}
                  onMouseLeave={(e) => e.currentTarget.style.color = "rgba(221,160,221,0.40)"}>
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
                style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(221,160,221,0.15) transparent" }}>

                {/* Title */}
                <div>
                  <NLabel>name</NLabel>
                  <NInput
                    autoFocus
                    value={form.title}
                    onChange={set("title")}
                    placeholder="what do you call this universe…"
                    style={{ fontFamily: "'Dancing Script', cursive", fontSize: "1.2rem" }}
                  />
                </div>

                {/* Description */}
                <div>
                  <NLabel>description</NLabel>
                  <NTextarea
                    value={form.description}
                    onChange={set("description")}
                    placeholder="describe it in her words… even vaguely"
                    rows={3}
                  />
                </div>

                {/* Status */}
                <div>
                  <NLabel>status</NLabel>
                  <div className="flex gap-2 flex-wrap">
                    {PROJECT_STATUSES.map((s) => (
                      <button key={s.value}
                        onClick={() => setV("status", s.value)}
                        style={{
                          fontFamily: "'Caveat', cursive",
                          fontSize: "0.9rem",
                          padding: "0.4rem 0.9rem",
                          borderRadius: "999px",
                          border: form.status === s.value
                            ? "1px solid rgba(221,160,221,0.40)"
                            : "1px solid rgba(221,160,221,0.12)",
                          background: form.status === s.value
                            ? "rgba(124,45,158,0.22)"
                            : "rgba(221,160,221,0.03)",
                          color: form.status === s.value
                            ? N.rose
                            : "rgba(221,160,221,0.45)",
                          transition: "all 0.2s ease",
                          cursor: "pointer",
                        }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <NLabel>categories</NLabel>
                  <div className="flex gap-2 flex-wrap">
                    {PROJECT_CATEGORIES.map((cat) => {
                      const selected = form.categories?.includes(cat.value);
                      return (
                        <button key={cat.value}
                          onClick={() => toggleCategory(cat.value)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            fontFamily: "'Caveat', cursive",
                            fontSize: "0.9rem",
                            padding: "0.4rem 0.9rem",
                            borderRadius: "999px",
                            border: selected
                              ? "1px solid rgba(232,192,122,0.38)"
                              : "1px solid rgba(221,160,221,0.12)",
                            background: selected
                              ? "rgba(232,192,122,0.10)"
                              : "rgba(221,160,221,0.03)",
                            color: selected ? N.gold : "rgba(221,160,221,0.45)",
                            transition: "all 0.2s ease",
                            cursor: "pointer",
                          }}>
                          {cat.icon} {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Repo link */}
                <div>
                  <NLabel>repository</NLabel>
                  <NInput
                    value={form.repoLink || ""}
                    onChange={set("repoLink")}
                    placeholder="https://github.com/…"
                  />
                </div>

                {/* Live URL */}
                <div>
                  <NLabel>live url</NLabel>
                  <NInput
                    value={form.liveUrl || ""}
                    onChange={set("liveUrl")}
                    placeholder="https://noori.app"
                  />
                </div>

                {/* Milestones */}
                <div>
                  <NLabel>milestones</NLabel>

                  {/* Existing milestones */}
                  {form.milestones?.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {form.milestones.map((m, i) => (
                        <motion.div key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl"
                          style={{ background: "rgba(221,160,221,0.04)", border: "1px solid rgba(221,160,221,0.09)" }}>
                          <Circle size={12} style={{ color: "rgba(221,160,221,0.25)", flexShrink: 0 }} />
                          <span className="flex-1" style={{
                            fontFamily: "'Caveat', cursive",
                            fontSize: "0.95rem",
                            color: "rgba(242,196,232,0.80)",
                          }}>
                            {m.title}
                          </span>
                          <button onClick={() => removeMilestone(i)}
                            className="transition-colors shrink-0"
                            style={{ color: "rgba(221,160,221,0.25)" }}
                            onMouseEnter={(e) => e.currentTarget.style.color = "#f87171"}
                            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(221,160,221,0.25)"}>
                            <Trash2 size={11} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Add milestone input */}
                  <div className="flex gap-2">
                    <input
                      ref={msRef}
                      value={msInput}
                      onChange={(e) => setMs(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMilestone())}
                      placeholder="add a milestone… press enter"
                      style={{
                        flex: 1,
                        background: N.inputBg,
                        border: `1px solid ${N.border}`,
                        borderRadius: "0.75rem",
                        padding: "0.55rem 0.9rem",
                        fontFamily: "'Caveat', cursive",
                        fontSize: "0.95rem",
                        color: N.rose,
                        outline: "none",
                        caretColor: N.gold,
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = N.borderHot}
                      onBlur={(e)  => e.currentTarget.style.borderColor = N.border}
                    />
                    <button onClick={addMilestone}
                      style={{
                        width: "2.4rem",
                        height: "2.4rem",
                        borderRadius: "0.75rem",
                        border: "1px solid rgba(221,160,221,0.18)",
                        background: "rgba(124,45,158,0.18)",
                        color: N.petal,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(124,45,158,0.30)"; e.currentTarget.style.borderColor = "rgba(221,160,221,0.30)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(124,45,158,0.18)"; e.currentTarget.style.borderColor = "rgba(221,160,221,0.18)"; }}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <NLabel>notes</NLabel>
                  <NTextarea
                    value={form.notes || ""}
                    onChange={set("notes")}
                    placeholder="notes, thoughts, loose threads…"
                    rows={3}
                  />
                </div>

              </div>

              {/* Footer */}
              <div className="px-6 py-4 shrink-0 flex gap-3"
                style={{ borderTop: "1px solid rgba(221,160,221,0.08)" }}>
                <button onClick={onClose}
                  style={{
                    flex: 1,
                    padding: "0.7rem",
                    borderRadius: "0.9rem",
                    border: "1px solid rgba(221,160,221,0.14)",
                    background: "transparent",
                    fontFamily: "'Caveat', cursive",
                    fontSize: "1rem",
                    color: "rgba(221,160,221,0.50)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = N.petal; e.currentTarget.style.borderColor = "rgba(221,160,221,0.25)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(221,160,221,0.50)"; e.currentTarget.style.borderColor = "rgba(221,160,221,0.14)"; }}>
                  never mind
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={!form.title.trim() || saving}
                  onClick={handleSave}
                  style={{
                    flex: 2,
                    padding: "0.7rem",
                    borderRadius: "0.9rem",
                    border: "1px solid rgba(221,160,221,0.22)",
                    background: "linear-gradient(135deg, rgba(124,45,158,0.45), rgba(221,160,221,0.12))",
                    fontFamily: "'Dancing Script', cursive",
                    fontSize: "1.15rem",
                    fontWeight: 600,
                    color: saving || !form.title.trim() ? "rgba(221,160,221,0.35)" : N.rose,
                    cursor: !form.title.trim() || saving ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: form.title.trim() && !saving ? "0 0 24px rgba(124,45,158,0.20)" : "none",
                  }}>
                  {saving ? "saving…" : initial ? "save changes ✦" : "bring it to life ✦"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}