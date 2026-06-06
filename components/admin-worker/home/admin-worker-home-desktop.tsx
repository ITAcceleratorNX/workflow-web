"use client";

import dynamic from "next/dynamic";

const ManagerDashboard = dynamic(
  () => import("@/components/manager/home/manager-home-dashboard"),
  { ssr: false }
);

/** Desktop — без redesign: тот же интерфейс, что у manager dashboard. */
export function AdminWorkerHomeDesktop() {
  return <ManagerDashboard />;
}
