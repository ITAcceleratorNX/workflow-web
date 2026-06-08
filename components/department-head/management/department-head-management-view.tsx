"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import { DepartmentHeadManagementHub } from "./department-head-management-hub";

export function DepartmentHeadManagementView() {
  const isDesktop = useIsDesktop();
  const router = useRouter();

  useEffect(() => {
    if (isDesktop) {
      router.replace("/department-head");
    }
  }, [isDesktop, router]);

  if (isDesktop) return null;

  return <DepartmentHeadManagementHub />;
}
