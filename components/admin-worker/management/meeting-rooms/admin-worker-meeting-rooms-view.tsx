"use client";

import { useAdminWorkerManagementCrudPage } from "@/hooks/use-admin-worker-management-crud-page";
import { AdminWorkerMeetingRoomsMobile } from "./admin-worker-meeting-rooms-mobile";

export function AdminWorkerMeetingRoomsView() {
  const { isDesktop } = useAdminWorkerManagementCrudPage();

  if (isDesktop) {
    return null;
  }

  return <AdminWorkerMeetingRoomsMobile />;
}
