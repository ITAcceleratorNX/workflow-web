"use client";

import { SmartHomeManagement } from "@/components/yandex-smart-home/SmartHomeManagement";
import { YandexSmartHomeAdmin } from "@/components/yandex-smart-home/YandexSmartHomeAdmin";
import { DepartmentHeadManagementMobileLayout } from "../department-head-management-mobile-layout";

export function DepartmentHeadSmartHomeMobile() {
  return (
    <DepartmentHeadManagementMobileLayout title="Умный дом">
      <div className="space-y-6">
        <SmartHomeManagement />
        <YandexSmartHomeAdmin />
      </div>
    </DepartmentHeadManagementMobileLayout>
  );
}
