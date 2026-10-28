"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { useTaskStatsPage } from "@/hooks/use-task-stats-page";
import { TaskStatsDesktopView } from "./task-stats-desktop-view";
import { TaskStatsMobileView } from "./task-stats-mobile-view";

/** «Статистика задач» of the tasks section: «•••» → «Статистика» on the tasks screen. */
export function TaskStatsView() {
  const isDesktop = useIsDesktop();
  const page = useTaskStatsPage();
  return isDesktop ? <TaskStatsDesktopView {...page} /> : <TaskStatsMobileView {...page} />;
}
