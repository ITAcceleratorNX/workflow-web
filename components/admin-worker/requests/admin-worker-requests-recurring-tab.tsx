"use client";

import { RecurringTasksList } from "@/components/recurring-tasks";

interface AdminWorkerRequestsRecurringTabProps {
  isDesktop: boolean;
  onDeleteTask: (id: number) => Promise<void>;
}

export function AdminWorkerRequestsRecurringTab({
  isDesktop,
  onDeleteTask,
}: AdminWorkerRequestsRecurringTabProps) {
  return (
    <RecurringTasksList
      userRole="admin-worker"
      isDesktop={isDesktop}
      onShowMap={() => {}}
      onDeleteTask={onDeleteTask}
    />
  );
}
