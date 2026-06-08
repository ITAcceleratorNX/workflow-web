"use client";

import dynamic from "next/dynamic";
import { DesktopContentPage } from "@/components/layout/desktop-content-page";
import { DesktopHubCards } from "@/components/layout/desktop-hub-cards";
import { MANAGER_CABINET_CARDS } from "@/components/manager/cabinet/manager-cabinet-constants";

const ManagerHomeDashboard = dynamic(
  () => import("@/components/manager/home/manager-home-dashboard"),
  { ssr: false },
);

/** Desktop manager home — quick links + existing dashboard. */
export function ManagerHomeDesktop() {
  const cards = MANAGER_CABINET_CARDS.map((c) => ({
    key: c.key,
    title: c.title,
    subtitle: c.subtitle,
    icon: c.icon,
    href: c.href,
  }));

  return (
    <div className="min-w-0">
      <DesktopContentPage title="Мой кабинет" description="Обзор и управление" dark>
        <DesktopHubCards cards={cards} columns={3} className="mb-8" />
      </DesktopContentPage>
      <ManagerHomeDashboard />
    </div>
  );
}
