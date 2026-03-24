"use client";
import { usePathname } from "next/navigation";
import { format } from "date-fns";
import { Calendar } from "lucide-react";

const PAGE_TITLES = {
  "/dashboard":    "Dashboard",
  "/tasks":        "Tasks",
  "/projects":     "Projects",
  "/habits":       "Habits",
  "/ideas":        "Idea Vault",
  "/jobs":         "Job Pipeline",
  "/learning":     "Learning Tracker",
  "/budget":       "Budget",
  "/journal":      "Daily Journal",
  "/activity":     "Activity Timeline",
  "/ai":           "AI Assistant",
  "/knowledge":    "Knowledge Vault",
  "/vision":       "Life Vision",
  "/heatmap":      "Life Heatmap",
  "/achievements": "Achievements",
};

export default function Topbar() {
  const pathname = usePathname();
  const title = Object.entries(PAGE_TITLES).find(([key]) =>
    pathname === key || pathname.startsWith(key + "/")
  )?.[1] || "SahilOS";

  const today = format(new Date(), "EEE, MMM d");

  return (
    <header className="h-14 shrink-0 flex items-center justify-between pl-16 pr-4 md:px-6 border-b border-surface-3 bg-surface-1/80 backdrop-blur-sm sticky top-0 z-20">
      <h1 className="text-base font-semibold text-slate-100">{title}</h1>
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Calendar size={12} />
        <span className="hidden sm:inline">{today}</span>
      </div>
    </header>
  );
}