"use client";

import type { UseClientTasksPageResult } from "@/hooks/use-client-tasks-page";
import { DesktopContentPage } from "@/components/layout/desktop-content-page";
import { ClientTasksMobileView } from "./client-tasks-mobile-view";

type ClientTasksDesktopViewProps = UseClientTasksPageResult;

/** Desktop tasks — reuses mobile task UI; ScreenHeader hidden on desktop. */
export function ClientTasksDesktopView(props: ClientTasksDesktopViewProps) {
  return (
    <DesktopContentPage title="Задачи" description="Inbox, сегодня, календарь и команды" dark>
      <ClientTasksMobileView {...props} />
    </DesktopContentPage>
  );
}
