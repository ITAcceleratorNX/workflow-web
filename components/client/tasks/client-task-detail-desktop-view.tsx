"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * On a desktop the task card sits next to the list: a link to /client/tasks/ID (calendar events,
 * notifications) opens the list with that card.
 */
export function ClientTaskDetailDesktopView({ taskId }: { taskId: number }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/client/tasks?task=${taskId}`);
  }, [router, taskId]);
  return (
    <div role="status" className="flex justify-center py-16">
      <Loader2 className="size-8 animate-spin text-ui-accent" aria-label="Открываем задачу" />
    </div>
  );
}
