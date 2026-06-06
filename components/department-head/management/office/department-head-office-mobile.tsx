"use client";

import { MeetingRoomsAdmin } from "@/components/meeting-rooms/MeetingRoomsAdmin";
import { DepartmentHeadManagementMobileLayout } from "../department-head-management-mobile-layout";

export function DepartmentHeadOfficeMobile() {
  return (
    <DepartmentHeadManagementMobileLayout title="Шаблоны локаций">
      <MeetingRoomsAdmin />
    </DepartmentHeadManagementMobileLayout>
  );
}
