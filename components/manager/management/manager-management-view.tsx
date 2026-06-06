"use client";

import dynamic from "next/dynamic";
import { useIsDesktop } from "@/hooks/use-media-query";

const ManagerHomeDashboard = dynamic(
  () => import("@/components/manager/home/manager-home-dashboard"),
  { ssr: false }
);

/** Management CRUD — desktop и mobile через ManagerHomeDashboard. */
export function ManagerManagementView() {
  const isDesktop = useIsDesktop();

  return (
    <div className={`min-h-screen ${isDesktop ? "" : "min-h-[100dvh] bg-[#1A1A1A]"}`}>
      <ManagerHomeDashboard standaloneManagement />
    </div>
  );
}
