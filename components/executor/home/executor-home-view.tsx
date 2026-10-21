"use client";

import { ExecutorDesktopShell } from "@/components/layout/ExecutorDesktopShell";
import { useExecutorHome } from "@/hooks/use-executor-home";
import { ExecutorHomeDesktop } from "./executor-home-desktop";
import { ManagementHomeMobile } from "@/components/layout/management-home-mobile";
import { EXECUTOR_CABINET_CARDS } from "./executor-home-constants";

export function ExecutorHomeView() {
  const state = useExecutorHome();

  if (state.isDesktop) {
    return (
      <ExecutorDesktopShell>
        <ExecutorHomeDesktop {...state} />
      </ExecutorDesktopShell>
    );
  }

  return (
    <ManagementHomeMobile
      title="Мой кабинет"
      subtitle="Выберите раздел"
      cards={EXECUTOR_CABINET_CARDS}
      onRefresh={state.handleRefresh}
    />
  );
}
