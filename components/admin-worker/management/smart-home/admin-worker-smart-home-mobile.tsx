"use client";

import { SmartHomeManagement } from "@/components/yandex-smart-home/SmartHomeManagement";
import { YandexSmartHomeAdmin } from "@/components/yandex-smart-home/YandexSmartHomeAdmin";
import { AdminWorkerManagementMobileLayout } from "../admin-worker-management-mobile-layout";

export function AdminWorkerSmartHomeMobile() {
  return (
    <AdminWorkerManagementMobileLayout title="Умный дом">
      <div className="space-y-6">
        <SmartHomeManagement />
        <YandexSmartHomeAdmin />
      </div>
    </AdminWorkerManagementMobileLayout>
  );
}
