"use client";

import { DesktopManagementPage } from "@/components/layout/desktop-management-page";
import { ClientTaskDetailMobileView } from "./client-task-detail-mobile-view";

type ClientTaskDetailDesktopViewProps = {
  taskId: number;
};

export function ClientTaskDetailDesktopView({ taskId }: ClientTaskDetailDesktopViewProps) {
  return (
    <DesktopManagementPage
      title="Задача"
      backHref="/client/tasks"
      backLabel="К списку задач"
    >
      <ClientTaskDetailMobileView taskId={taskId} layout="desktop" />
    </DesktopManagementPage>
  );
}
