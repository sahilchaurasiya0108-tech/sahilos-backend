"use client";
import { useEffect } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import { Button } from "./index";

export default function Modal({ open, onClose, title, children, size = "md" }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const sizes = {
    sm: "sm:max-w-md",
    md: "sm:max-w-lg",
    lg: "sm:max-w-2xl",
    xl: "sm:max-w-3xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel — full-width bottom sheet on mobile, centered card on sm+ */}
      <div
        className={clsx(
          "relative w-full bg-surface-1 border border-surface-3 shadow-2xl",
          "animate-slide-up max-h-[92dvh] flex flex-col",
          "rounded-t-2xl sm:rounded-2xl",
          sizes[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-surface-3" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-3 shrink-0">
          <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-1.5 rounded-lg">
            <X size={16} />
          </Button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
