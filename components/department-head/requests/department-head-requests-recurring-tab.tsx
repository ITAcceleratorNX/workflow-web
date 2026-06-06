"use client";

import { RecurringTasksList } from "@/components/recurring-tasks";

interface DepartmentHeadRequestsRecurringTabProps {
  isDesktop: boolean;
  onDeleteTask: (id: number) => Promise<void>;
}

export function DepartmentHeadRequestsRecurringTab({
  isDesktop,
  onDeleteTask,
}: DepartmentHeadRequestsRecurringTabProps) {
  return (
    <RecurringTasksList
      userRole="department-head"
      isDesktop={isDesktop}
      onShowMap={() => {}}
      onDeleteTask={onDeleteTask}
    />
  );
}
