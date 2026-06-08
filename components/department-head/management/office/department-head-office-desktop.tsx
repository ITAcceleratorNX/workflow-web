"use client";

import { MeetingRoomsAdmin } from "@/components/meeting-rooms/MeetingRoomsAdmin";
import { DesktopManagementPage } from "@/components/layout/desktop-management-page";
import { DEPARTMENT_HEAD_MANAGEMENT_BACK_HREF } from "@/hooks/use-department-head-management-crud-page";

export function DepartmentHeadOfficeDesktop() {
  return (
    <DesktopManagementPage title="Офис" backHref={DEPARTMENT_HEAD_MANAGEMENT_BACK_HREF}>
      <MeetingRoomsAdmin />
    </DesktopManagementPage>
  );
}
