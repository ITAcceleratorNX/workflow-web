"use client";

import type { UseClientSmartHomeResult } from "@/hooks/use-client-smart-home";
import { DesktopManagementPage } from "@/components/layout/desktop-management-page";
import { ClientSmartHomeMobileView } from "@/components/yandex-smart-home/client-smart-home-mobile-view";

type ClientSmartHomeDesktopViewProps = UseClientSmartHomeResult;

export function ClientSmartHomeDesktopView(props: ClientSmartHomeDesktopViewProps) {
  return (
    <DesktopManagementPage
      title="Управление умным офисом"
      backHref="/client"
      backLabel="На главную"
    >
      <ClientSmartHomeMobileView {...props} />
    </DesktopManagementPage>
  );
}
