"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { TasksSection } from "@/components/tasks/tasks-section";
import { DesktopContentPage } from "@/components/layout/desktop-content-page";
import { DesktopHubCards } from "@/components/layout/desktop-hub-cards";
import { ADMIN_WORKER_HOME_CARDS } from "./admin-worker-home-constants";

/** Desktop home — card hub + tasks (parity mobile). */
export function AdminWorkerHomeDesktop() {
  const cards = ADMIN_WORKER_HOME_CARDS.map((c) => ({
    key: c.key,
    title: c.title,
    subtitle: c.subtitle,
    icon: c.icon,
    href: c.href,
  }));

  return (
    <DesktopContentPage
      title="Управление системой"
      description="Выберите раздел для управления"
      dark
      actions={
        <Link
          href="/notifications"
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Уведомления"
        >
          <Bell className="w-6 h-6 text-white" />
        </Link>
      }
    >
      <DesktopHubCards cards={cards} columns={3} />
      <TasksSection layout="embedded" />
    </DesktopContentPage>
  );
}
