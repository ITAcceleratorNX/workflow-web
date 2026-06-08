"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { ClientTaskDetailDesktopView } from "./client-task-detail-desktop-view";
import { ClientTaskDetailMobileView } from "./client-task-detail-mobile-view";

type ClientTaskDetailViewProps = {
  taskId: number;
};

export function ClientTaskDetailView({ taskId }: ClientTaskDetailViewProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return <ClientTaskDetailDesktopView taskId={taskId} />;
  }

  return <ClientTaskDetailMobileView taskId={taskId} />;
}
