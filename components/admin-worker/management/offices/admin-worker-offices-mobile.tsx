"use client";

import { MeetingRoomsAdmin } from "@/components/meeting-rooms/MeetingRoomsAdmin";
import { AdminWorkerManagementMobileLayout } from "../admin-worker-management-mobile-layout";

interface AdminWorkerOfficesMobileProps {
  title: string;
}

export function AdminWorkerOfficesMobile({ title }: AdminWorkerOfficesMobileProps) {
  return (
    <AdminWorkerManagementMobileLayout title={title}>
      <MeetingRoomsAdmin />
    </AdminWorkerManagementMobileLayout>
  );
}
