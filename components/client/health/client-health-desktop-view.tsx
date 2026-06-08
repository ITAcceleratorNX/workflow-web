"use client";

import { DesktopManagementPage } from "@/components/layout/desktop-management-page";
import { ClientHealthMobileView } from "./client-health-mobile-view";

export function ClientHealthDesktopView() {
  return (
    <DesktopManagementPage
      title="Health трекер"
      description="Вода, настроение, шаги и AI insights"
      backHref="/client"
      backLabel="На главную"
    >
      <ClientHealthMobileView layout="desktop" />
    </DesktopManagementPage>
  );
}
