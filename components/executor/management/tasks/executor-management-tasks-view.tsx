"use client";

import { useExecutorManagementTasks } from "@/hooks/use-executor-management-tasks";
import type { ExecutorRequestsTab } from "@/components/executor/requests/executor-requests-constants";
import { ExecutorManagementTasksMobile } from "./executor-management-tasks-mobile";

interface ExecutorManagementTasksViewProps {
  tab: ExecutorRequestsTab;
}

export function ExecutorManagementTasksView({ tab }: ExecutorManagementTasksViewProps) {
  const state = useExecutorManagementTasks(tab);

  if (state.isDesktop) {
    return null;
  }

  return <ExecutorManagementTasksMobile {...state} />;
}
