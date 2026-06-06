"use client";

import { useExecutorManagement } from "@/hooks/use-executor-management";
import { ExecutorManagementDesktop } from "./executor-management-desktop";
import { ExecutorManagementMobile } from "./executor-management-mobile";

export function ExecutorManagementView() {
  const { isDesktop } = useExecutorManagement();

  if (isDesktop) {
    return <ExecutorManagementDesktop />;
  }

  return <ExecutorManagementMobile />;
}
