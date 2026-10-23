"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { TaskDetail } from "@/components/tasks/task-detail";
import { useCurrentTaskDay } from "@/hooks/use-current-task-day";

/** Phone screen of one task (Figma «Задачи · Карточка задачи»). */
export function ClientTaskDetailMobileView({ taskId }: { taskId: number }) {
  const router = useRouter();
  const todayKey = useCurrentTaskDay();
  // A task opened from a link has no screen behind it: go to the list instead.
  const back = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.replace("/client/tasks");
  }, [router]);
  return <TaskDetail taskId={taskId} todayKey={todayKey} variant="page" onClose={back} onGone={back} />;
}
