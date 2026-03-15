"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  CheckSquare, CheckCircle, Zap, FolderPlus, Folder,
  Briefcase, ArrowRight, Lightbulb, BookOpen, GraduationCap, Activity,
} from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import PageWrapper from "@/components/layout/PageWrapper";
import { ACTIVITY_META } from "@/lib/constants";
import api from "@/lib/api";
import clsx from "clsx";

const ICON_MAP = {
  CheckSquare, CheckCircle, Zap, FolderPlus, Folder,
  Briefcase, ArrowRight, Lightbulb, BookOpen, GraduationCap,
};

export default function ActivityPage() {
  const [activities, setActivities] = useState([]);
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchActivity = useCallback(async (p = 1, append = false) => {
    try {
      append ? setLoadingMore(true) : setLoading(true);
      const res = await api.get(`/activity?page=${p}&limit=20`);
      setActivities((prev) => append ? [...prev, ...res.data.data] : res.data.data);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchActivity(1); }, [fetchActivity]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchActivity(next, true);
  };

  // Group activities by date
  const grouped = activities.reduce((acc, a) => {
    const day = format(new Date(a.createdAt), "yyyy-MM-dd");
    if (!acc[day]) acc[day] = [];
    acc[day].push(a);
    return acc;
  }, {});

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="page-title">Activity Timeline</h1>
          <p className="text-sm text-slate-500 mt-0.5">Your personal action history</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : activities.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Activity size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No activity yet — start doing things!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([day, acts]) => (
              <div key={day}>
                <p className="section-title mb-4">
                  {format(new Date(day), "EEEE, MMMM d")}
                </p>
                <div className="relative space-y-1 pl-5">
                  {/* Timeline line */}
                  <div className="absolute left-1.5 top-2 bottom-2 w-px bg-surface-3" />

                  {acts.map((a) => {
                    const meta = ACTIVITY_META[a.type];
                    const Icon = ICON_MAP[meta?.icon] || Activity;

                    return (
                      <div key={a._id} className="relative flex items-start gap-4 py-3 px-4 rounded-xl hover:bg-surface-2 transition-colors group">
                        {/* Dot on timeline */}
                        <div className={clsx("absolute -left-[3px] top-5 h-3 w-3 rounded-full border-2 border-surface-1 bg-current", meta?.color || "text-slate-500")} />

                        {/* Icon */}
                        <div className={clsx("h-8 w-8 rounded-lg bg-surface-2 flex items-center justify-center shrink-0", meta?.color || "text-slate-500")}>
                          <Icon size={14} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-300 font-medium truncate">{a.entityTitle}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-slate-600">{meta?.label}</p>
                            <span className="text-slate-700">·</span>
                            <p className="text-xs text-slate-600">{format(new Date(a.createdAt), "h:mm a")}</p>
                          </div>
                          {/* Meta extras (stage changes, streak, mood) */}
                          {a.meta?.from && a.meta?.to && (
                            <p className="text-xs text-slate-600 mt-0.5">
                              {a.meta.from} → {a.meta.to}
                            </p>
                          )}
                          {a.meta?.streak > 1 && (
                            <p className="text-xs text-amber-400 mt-0.5">🔥 {a.meta.streak}-day streak</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Load more */}
            {pagination?.hasNext && (
              <div className="flex justify-center pt-2">
                <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? <><Spinner size="sm" />Loading…</> : "Load More"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
