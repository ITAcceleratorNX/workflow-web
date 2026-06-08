"use client";

import { SmartHomeManagement } from "@/components/yandex-smart-home/SmartHomeManagement";
import { YandexSmartHomeAdmin } from "@/components/yandex-smart-home/YandexSmartHomeAdmin";
import { DesktopManagementPage } from "@/components/layout/desktop-management-page";
import { DEPARTMENT_HEAD_MANAGEMENT_BACK_HREF } from "@/hooks/use-department-head-management-crud-page";

export function DepartmentHeadSmartHomeDesktop() {
  return (
    <DesktopManagementPage title="Умный офис" backHref={DEPARTMENT_HEAD_MANAGEMENT_BACK_HREF}>
      <div className="space-y-6">
        <SmartHomeManagement dark />
        <YandexSmartHomeAdmin dark />
      </div>
    </DesktopManagementPage>
  );
}
