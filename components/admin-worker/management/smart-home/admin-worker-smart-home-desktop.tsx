"use client";

import { SmartHomeManagement } from "@/components/yandex-smart-home/SmartHomeManagement";
import { YandexSmartHomeAdmin } from "@/components/yandex-smart-home/YandexSmartHomeAdmin";
import { DesktopManagementPage } from "@/components/layout/desktop-management-page";
import { ADMIN_WORKER_MANAGEMENT_BACK_HREF } from "@/hooks/use-admin-worker-management-crud-page";

export function AdminWorkerSmartHomeDesktop() {
  return (
    <DesktopManagementPage title="Умный офис" backHref={ADMIN_WORKER_MANAGEMENT_BACK_HREF}>
      <div className="space-y-6">
        <SmartHomeManagement dark />
        <YandexSmartHomeAdmin dark />
      </div>
    </DesktopManagementPage>
  );
}
