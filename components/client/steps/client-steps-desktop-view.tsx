"use client";

import { DesktopManagementPage } from "@/components/layout/desktop-management-page";
import { ClientStepsMobileView } from "./client-steps-mobile-view";

export function ClientStepsDesktopView() {
  return (
    <DesktopManagementPage
      title="Шаги"
      description="Активность и цели"
      backHref="/client/health"
      backLabel="К Health трекеру"
    >
      <ClientStepsMobileView layout="desktop" />
    </DesktopManagementPage>
  );
}
