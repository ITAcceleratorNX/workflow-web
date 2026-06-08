"use client";

import { DesktopContentPage } from "@/components/layout/desktop-content-page";
import { ClientStepsMobileView } from "./client-steps-mobile-view";

export function ClientStepsDesktopView() {
  return (
    <DesktopContentPage title="Шаги" description="Активность и цели (ручной ввод на desktop)" dark>
      <ClientStepsMobileView />
    </DesktopContentPage>
  );
}
