"use client";

import { DesktopContentPage } from "@/components/layout/desktop-content-page";
import { ClientTaskDetailMobileView } from "./client-task-detail-mobile-view";

type ClientTaskDetailDesktopViewProps = {
  taskId: number;
};

export function ClientTaskDetailDesktopView({ taskId }: ClientTaskDetailDesktopViewProps) {
  return (
    <DesktopContentPage
      title="Задача"
    >
      <ClientTaskDetailMobileView taskId={taskId} layout="desktop" />
    </DesktopContentPage>
  );
}
