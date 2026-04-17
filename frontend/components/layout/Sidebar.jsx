"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, CheckSquare, Folder, Zap, Lightbulb,
  Briefcase, GraduationCap, BookOpen, Activity, LogOut,
  ChevronRight, Wallet, Sparkles, Menu, X,
  Brain, Compass, BarChart2, Trophy, Bell,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/ui";
import { useThreadNotifications } from "@/context/ThreadNotificationContext";

const ICON_MAP = {
  LayoutDashboard, CheckSquare, Folder, Zap, Lightbulb,
  Briefcase, GraduationCap, BookOpen, Activity, Wallet, Sparkles,
  Brain, Compass, BarChart2, Trophy, Bell,
};

function ThreadIcon({ size = 16, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 1v2M8 13v2M1 8h2M13 8h2"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"
      />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: "/dashboard",     label: "Dashboard",     icon: "LayoutDashboard" },
  { href: "/tasks",         label: "Tasks",         icon: "CheckSquare" },
  { href: "/projects",      label: "Projects",      icon: "Folder" },
  { href: "/habits",        label: "Habits",        icon: "Zap" },
  { href: "/ideas",         label: "Ideas",         icon: "Lightbulb" },
  { href: "/jobs",          label: "Jobs",          icon: "Briefcase" },
  { href: "/learning",      label: "Learning",      icon: "GraduationCap" },
  { href: "/budget",        label: "Budget",        icon: "Wallet" },
  { href: "/knowledge",     label: "Knowledge",     icon: "Brain" },
  { href: "/vision",        label: "Life Vision",   icon: "Compass" },
  { href: "/heatmap",       label: "Heatmap",       icon: "BarChart2" },
  { href: "/achievements",  label: "Achievements",  icon: "Trophy" },
  { href: "/journal",       label: "Journal",       icon: "BookOpen" },
  { href: "/activity",      label: "Activity",      icon: "Activity" },
  { href: "/notifications", label: "Notifications", icon: "Bell" },
  { href: "/ai",            label: "AI Assistant",  icon: "Sparkles" },
];

function NavContent({ onNavClick }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { unreadCount, resetUnread } = useThreadNotifications();

  const handleThreadClick = () => {
    resetUnread();
    onNavClick?.();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-surface-3 shrink-0">
        <span className="text-xl font-bold tracking-tight">
          <span className="text-brand">Sahil</span>
          <span className="text-slate-100">OS</span>
        </span>
        <p className="text-[11px] text-slate-500 mt-0.5 font-medium uppercase tracking-widest">
          Personal OS
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {/* ── Red Thread ───────────────────────────────────────────────────── */}
        <Link
          href="/thread"
          onClick={handleThreadClick}
          className={clsx(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group mb-2",
            pathname === "/thread"
              ? "bg-red-500/15 text-red-400"
              : "text-slate-400 hover:text-slate-100 hover:bg-surface-2 border border-dashed border-red-500/20"
          )}
        >
          <ThreadIcon
            size={16}
            className={clsx(
              pathname === "/thread" ? "text-red-400" : "text-red-500/40 group-hover:text-red-400/70"
            )}
          />
          <span
            className="flex-1"
            style={{ fontFamily: "'Caveat', cursive", fontSize: "1.05rem", letterSpacing: "0.01em" }}
          >
            The Red Thread
          </span>

          {/* Unread badge */}
          {pathname !== "/thread" && unreadCount > 0 && (
            <span
              id="badge"
              className="text-[10px] bg-red-500/20 text-red-400 px-1.5 rounded-full font-bold min-w-[20px] text-center"
              style={{ paddingTop: "3px", paddingBottom: "3px", lineHeight: 1 }}
            >
              ({unreadCount})
            </span>
          )}
          {pathname !== "/thread" && unreadCount === 0 && (
            <span className="text-[10px] bg-red-500/10 text-red-400/70 px-1.5 py-0.5 rounded font-semibold">
              ∞
            </span>
          )}
          {pathname === "/thread" && (
            <ChevronRight size={12} className="text-red-400 opacity-60" />
          )}
        </Link>

        {/* ── Regular nav items ─────────────────────────────────────────── */}
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const Icon   = ICON_MAP[icon];
          const active = pathname === href || pathname.startsWith(href + "/");
          const isAI   = href === "/ai";
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavClick}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                active ? "bg-brand/15 text-brand" : "text-slate-400 hover:text-slate-100 hover:bg-surface-2",
                isAI && !active && "border border-dashed border-surface-3 mt-2"
              )}
            >
              <Icon
                size={16}
                className={clsx(
                  active ? "text-brand" : "text-slate-500 group-hover:text-slate-300",
                  isAI && !active && "text-brand/60"
                )}
              />
              <span className="flex-1">{label}</span>
              {isAI && !active && (
                <span className="text-[10px] bg-brand/20 text-brand px-1.5 py-0.5 rounded font-semibold">AI</span>
              )}
              {active && <ChevronRight size={12} className="text-brand opacity-60" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-surface-3 px-3 py-3 shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <Avatar name={user?.name || ""} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-500 hover:text-danger hover:bg-danger/10 transition-colors"
            title="Logout"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function DesktopSidebar() {
  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 hidden md:flex flex-col bg-surface-1 border-r border-surface-3">
      <NavContent />
    </aside>
  );
}

function MobileDrawer({ open, onClose }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={onClose} />
      )}
      <aside
        className={clsx(
          "fixed top-0 left-0 z-50 h-full w-72 bg-surface-1 border-r border-surface-3",
          "transform transition-transform duration-250 ease-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-slate-100 hover:bg-surface-2"
        >
          <X size={16} />
        </button>
        <NavContent onNavClick={onClose} />
      </aside>
    </>
  );
}

export function MobileMenuButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-surface-2 transition-colors"
    >
      <Menu size={18} />
    </button>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <>
      <DesktopSidebar />
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <button
        id="mobile-menu-btn"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3.5 left-4 z-30 p-2 rounded-lg bg-surface-1 border border-surface-3 text-slate-400 hover:text-slate-100 transition-colors"
      >
        <Menu size={18} />
      </button>
    </>
  );
}
