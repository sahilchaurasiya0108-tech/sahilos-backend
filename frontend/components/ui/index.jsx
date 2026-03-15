"use client";
import clsx from "clsx";

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({ variant = "primary", size = "md", className, children, ...props }) {
  const base = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

  const variants = {
    primary: "bg-brand hover:bg-brand-dark text-white",
    ghost:   "text-slate-400 hover:text-slate-100 hover:bg-surface-2",
    danger:  "bg-danger/10 hover:bg-danger/20 text-danger",
    outline: "border border-surface-3 hover:border-brand/40 text-slate-300 hover:text-slate-100 bg-transparent",
    success: "bg-success/10 hover:bg-success/20 text-success",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  return (
    <button className={clsx(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ className, children, ...props }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = "md", className }) {
  const sizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" };
  return (
    <svg
      className={clsx("animate-spin text-brand", sizes[size], className)}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// ── ProgressBar ───────────────────────────────────────────────────────────────
export function ProgressBar({ value = 0, className, color = "bg-brand" }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={clsx("h-1.5 w-full bg-surface-3 rounded-full overflow-hidden", className)}>
      <div
        className={clsx("h-full rounded-full transition-all duration-500", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      {Icon && (
        <div className="mb-4 p-4 rounded-2xl bg-surface-2 text-slate-500">
          <Icon size={32} />
        </div>
      )}
      <p className="text-slate-300 font-medium mb-1">{title}</p>
      {description && <p className="text-slate-500 text-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, error, className, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-400">{label}</label>}
      <input
        className={clsx(
          "bg-surface-2 border text-slate-100 placeholder-slate-500 rounded-lg px-3 py-2 w-full",
          "focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-150",
          error ? "border-danger" : "border-surface-3",
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

// ── Textarea ──────────────────────────────────────────────────────────────────
export function Textarea({ label, error, className, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-400">{label}</label>}
      <textarea
        className={clsx(
          "bg-surface-2 border text-slate-100 placeholder-slate-500 rounded-lg px-3 py-2 w-full resize-none",
          "focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-150",
          error ? "border-danger" : "border-surface-3",
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ label, error, className, children, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-400">{label}</label>}
      <select
        className={clsx(
          "bg-surface-2 border text-slate-100 rounded-lg px-3 py-2 w-full",
          "focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-150",
          error ? "border-danger" : "border-surface-3",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ name = "", src, size = "md" }) {
  const sizes = { sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm", lg: "h-12 w-12 text-base" };
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  if (src) {
    return <img src={src} alt={name} className={clsx("rounded-full object-cover", sizes[size])} />;
  }
  return (
    <div className={clsx("rounded-full bg-brand/20 text-brand font-semibold flex items-center justify-center", sizes[size])}>
      {initials}
    </div>
  );
}
