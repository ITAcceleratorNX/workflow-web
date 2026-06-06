"use client";

import { ExecutorDesktopShell } from "@/components/layout/ExecutorDesktopShell";
import { useExecutorHome } from "@/hooks/use-executor-home";
import { ExecutorHomeDesktop } from "./executor-home-desktop";
import { ExecutorHomeMobile } from "./executor-home-mobile";

export function ExecutorHomeView() {
  const state = useExecutorHome();

  if (state.isDesktop) {
    return (
      <ExecutorDesktopShell>
        <ExecutorHomeDesktop {...state} />
      </ExecutorDesktopShell>
    );
  }

  return <ExecutorHomeMobile {...state} />;
}
