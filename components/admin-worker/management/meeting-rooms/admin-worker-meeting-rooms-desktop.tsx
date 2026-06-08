"use client";

import { MeetingRoomsAdmin } from "@/components/meeting-rooms/MeetingRoomsAdmin";
import { DesktopManagementPage } from "@/components/layout/desktop-management-page";
import { ADMIN_WORKER_MANAGEMENT_BACK_HREF } from "@/hooks/use-admin-worker-management-crud-page";

export function AdminWorkerMeetingRoomsDesktop() {
  return (
    <DesktopManagementPage title="Переговорные" backHref={ADMIN_WORKER_MANAGEMENT_BACK_HREF}>
      <MeetingRoomsAdmin variant="dark" />
    </DesktopManagementPage>
  );
}
