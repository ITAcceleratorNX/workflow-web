"use client";

import { SmartHomeAdminMobileScreen } from "@/components/yandex-smart-home/smart-home-admin-mobile-view";
import { DepartmentHeadManagementMobileLayout } from "../department-head-management-mobile-layout";

export function DepartmentHeadSmartHomeMobile() {
  return (
    <DepartmentHeadManagementMobileLayout title="Умный офис">
      <SmartHomeAdminMobileScreen />
    </DepartmentHeadManagementMobileLayout>
  );
}
