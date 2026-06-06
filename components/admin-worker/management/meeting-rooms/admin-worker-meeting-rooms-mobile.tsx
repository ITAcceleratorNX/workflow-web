"use client";

import { MeetingRoomsAdmin } from "@/components/meeting-rooms/MeetingRoomsAdmin";
import { AdminWorkerManagementMobileLayout } from "../admin-worker-management-mobile-layout";

export function AdminWorkerMeetingRoomsMobile() {
  return (
    <AdminWorkerManagementMobileLayout title="Переговорные">
      <MeetingRoomsAdmin />
    </AdminWorkerManagementMobileLayout>
  );
}
