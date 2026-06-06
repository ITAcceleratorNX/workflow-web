"use client";

import { SmartHomeAdminMobileScreen } from "@/components/yandex-smart-home/smart-home-admin-mobile-view";
import { AdminWorkerManagementMobileLayout } from "../admin-worker-management-mobile-layout";

export function AdminWorkerSmartHomeMobile() {
  return (
    <AdminWorkerManagementMobileLayout title="Умный офис">
      <SmartHomeAdminMobileScreen />
    </AdminWorkerManagementMobileLayout>
  );
}
