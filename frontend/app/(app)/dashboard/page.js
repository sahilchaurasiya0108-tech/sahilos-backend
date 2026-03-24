"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { useAchievements } from "@/hooks/useAchievements";
import { useDailyStat } from "@/hooks/useDailyStat";
import { Spinner } from "@/components/ui";
import {
  GreetingCard,
  FocusTasksWidget,
  HabitStreakWidget,
  ProjectProgressWidget,
  JobPipelineWidget,
  LearningWidget,
  ActivityFeedWidget,
  TaskStatsWidget,
  BudgetWidget,
  AchievementsWidget,
} from "@/components/dashboard/widgets";
import LifeHeatmap from "@/components/heatmap/LifeHeatmap";
import PageWrapper from "@/components/layout/PageWrapper";
import { format, subDays } from "date-fns";

export default function DashboardPage() {
  const { data, loading, error } = useDashboard();
  const { achievements, summary: achSummary } = useAchievements();
  const today = format(new Date(), "yyyy-MM-dd");
  const from  = format(subDays(new Date(), 182), "yyyy-MM-dd");
  const { stats: heatmapStats, loading: heatmapLoading } = useDailyStat({ from, to: today });

  if (loading) {
    return (
      <PageWrapper className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <p className="text-danger text-sm text-center py-20">{error}</p>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-3">

        {/* ── Hero ── */}
        <GreetingCard name={data.greeting.name} />

        {/* ── Row 1: Tasks + Habits + Task Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <FocusTasksWidget tasks={data.focusTasks} />
          <HabitStreakWidget habits={data.habits} />
          <TaskStatsWidget stats={data.taskStats} />
        </div>

        {/* ── Row 2: Projects + Jobs + Learning ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <ProjectProgressWidget projects={data.activeProjects} />
          <JobPipelineWidget pipeline={data.jobPipeline} />
          <LearningWidget items={data.learningInProgress} />
        </div>

        {/* ── Row 3: Budget + Achievements + Activity ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <BudgetWidget budget={data.budget} />
          <AchievementsWidget achievements={achievements} summary={achSummary} />
          <ActivityFeedWidget activities={data.recentActivity} />
        </div>

        {/* ── Heatmap full width ── */}
        {!heatmapLoading && (
          <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(145deg, #161b27 0%, #111520 100%)", border: "1px solid #ffffff0d" }}>
            <LifeHeatmap stats={heatmapStats} weeks={26} />
          </div>
        )}

      </div>
    </PageWrapper>
  );
}
