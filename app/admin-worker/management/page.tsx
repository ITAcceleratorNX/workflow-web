"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useIsDesktop } from "@/hooks/use-media-query";

const ManagerDashboard = dynamic(
  () => import("@/components/manager/home/manager-home-dashboard"),
  { ssr: false },
);

/** Desktop: ManagerDashboard. Mobile: redirect на `/admin-worker` (единый home, без дубля hub). */
export default function ManagementPage() {
  const isDesktop = useIsDesktop();
  const router = useRouter();

  useEffect(() => {
    if (!isDesktop) {
      router.replace("/admin-worker");
    }
  }, [isDesktop, router]);

  if (!isDesktop) {
    return null;
  }

  return <ManagerDashboard standaloneManagement />;
}
