"use client";

import { MobilePageLayout } from "@/components/layout/MobilePageLayout";
import { ExecutorRoomsRequestsView } from "@/components/meeting-rooms/ExecutorRoomsRequestsView";
import { EXECUTOR_MANAGEMENT_TASKS_BACK_HREF } from "@/hooks/use-executor-management-tasks";
import type { UseExecutorMeetingRoomsResult } from "@/hooks/use-executor-meeting-rooms";

type ExecutorMeetingRoomsMobileProps = UseExecutorMeetingRoomsResult;

export function ExecutorMeetingRoomsMobile({
  offices,
  myRequests,
  assignedRequests,
  completedRequests,
  loading,
  handleRefresh,
  handleRequestClick,
}: ExecutorMeetingRoomsMobileProps) {
  return (
    <MobilePageLayout
      title="Переговорные"
      onRefresh={handleRefresh}
      backHref={EXECUTOR_MANAGEMENT_TASKS_BACK_HREF}
      gradient="plain"
    >
      {loading ? (
        <div className="text-white/80 py-8 text-center">Загрузка...</div>
      ) : (
        <ExecutorRoomsRequestsView
          offices={offices}
          myRequests={myRequests}
          assignedRequests={assignedRequests}
          completedRequests={completedRequests}
          onRequestClick={handleRequestClick}
        />
      )}
    </MobilePageLayout>
  );
}
