"use client";

import { DesktopContentPage } from "@/components/layout/desktop-content-page";
import { ClientSleepMobileView } from "./client-sleep-mobile-view";

export function ClientSleepDesktopView() {
  return (
    <DesktopContentPage title="Сон" description="Расписание сна и утренний опрос" dark>
      <ClientSleepMobileView />
    </DesktopContentPage>
  );
}
