"use client";

import { ExecutorDesktopShell } from "@/components/layout/ExecutorDesktopShell";
import { ExecutorRoomsRequestsView } from "@/components/meeting-rooms/ExecutorRoomsRequestsView";
import type { UseExecutorMeetingRoomsResult } from "@/hooks/use-executor-meeting-rooms";

type ExecutorMeetingRoomsDesktopProps = UseExecutorMeetingRoomsResult;

export function ExecutorMeetingRoomsDesktop({
  offices,
  myRequests,
  assignedRequests,
  completedRequests,
  loading,
  handleRequestClick,
}: ExecutorMeetingRoomsDesktopProps) {
  return (
    <ExecutorDesktopShell>
      <div className="client-desktop-content p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="client-desktop-dark">
          <h1 className="text-xl font-semibold text-white mb-4">Переговорные</h1>
          {loading ? (
            <p className="text-white/60 py-8 text-center">Загрузка...</p>
          ) : (
            <ExecutorRoomsRequestsView
              offices={offices}
              myRequests={myRequests}
              assignedRequests={assignedRequests}
              completedRequests={completedRequests}
              onRequestClick={handleRequestClick}
            />
          )}
        </div>
      </div>
    </ExecutorDesktopShell>
  );
}
