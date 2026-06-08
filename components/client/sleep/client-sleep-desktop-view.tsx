"use client";

import { DesktopManagementPage } from "@/components/layout/desktop-management-page";
import { ClientSleepMobileView } from "./client-sleep-mobile-view";

export function ClientSleepDesktopView() {
  return (
    <DesktopManagementPage
      title="Сон"
      description="Расписание сна и утренний опрос"
      backHref="/client/health"
      backLabel="К Health трекеру"
    >
      <ClientSleepMobileView layout="desktop" />
    </DesktopManagementPage>
  );
}
