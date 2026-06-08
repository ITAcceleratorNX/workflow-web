"use client";

import { TasksSection } from "@/components/tasks/tasks-section";
import { DesktopContentPage } from "@/components/layout/desktop-content-page";
import { DesktopHubCards } from "@/components/layout/desktop-hub-cards";
import { EXECUTOR_CABINET_CARDS } from "@/components/executor/home/executor-home-constants";

/** Desktop executor management hub — parity mobile. */
export function ExecutorManagementDesktop() {
  const cards = EXECUTOR_CABINET_CARDS.map((c) => ({
    key: c.key,
    title: c.title,
    subtitle: c.subtitle,
    icon: c.icon,
    href: c.href,
  }));

  return (
    <DesktopContentPage title="Мой кабинет" description="Выберите раздел" dark>
      <DesktopHubCards cards={cards} columns={2} className="max-w-2xl" />
      <TasksSection layout="embedded" />
    </DesktopContentPage>
  );
}
