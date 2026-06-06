"use client";

import React from "react";
import { useIsDesktop } from "@/hooks/use-media-query";
import ManagerDashboard from "../page";

export default function ManagerManagementPage() {
  const isDesktop = useIsDesktop();

  // На десктопе показываем контент управления как отдельную страницу
  if (isDesktop) {
    return <ManagerDashboard standaloneManagement />;
  }

  // На мобилке: обёртка с тёмным фоном на всю высоту (включая область за навбаром), отступ снизу задаёт ManagerDashboard
  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#1A1A1A]">
      <ManagerDashboard standaloneManagement />
    </div>
  );
}
