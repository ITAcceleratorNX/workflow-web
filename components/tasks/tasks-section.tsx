"use client";

import { useRouter } from "next/navigation";
import { TasksTodayCard } from "@/components/tasks/tasks-today-card";
import { cn } from "@/lib/utils";

export type TasksSectionLayout = "standalone" | "embedded";

type TasksSectionProps = {
  /**
   * `embedded` — внутри страницы с горизонтальными отступами (главные admin/executor/department-head).
   */
  layout?: TasksSectionLayout;
};

/** Секция «Задачи» на главных — parity с workflow-mobile TasksSection. */
export function TasksSection({ layout = "standalone" }: TasksSectionProps) {
  const router = useRouter();
  const embedded = layout === "embedded";

  return (
    <section className={cn(embedded ? "mt-6 pb-4" : "mt-6 pb-4")}>
      <h2
        className={cn(
          "text-xl font-bold text-foreground mb-4",
          !embedded && "px-0",
        )}
      >
        Задачи
      </h2>
      <TasksTodayCard
        onPress={() => router.push("/client/tasks?tab=today&view=list")}
      />
    </section>
  );
}
