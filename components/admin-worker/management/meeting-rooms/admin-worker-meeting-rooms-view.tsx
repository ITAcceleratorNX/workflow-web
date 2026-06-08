"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { AdminWorkerMeetingRoomsDesktop } from "./admin-worker-meeting-rooms-desktop";
import { AdminWorkerMeetingRoomsMobile } from "./admin-worker-meeting-rooms-mobile";

export function AdminWorkerMeetingRoomsView() {
  const isDesktop = useIsDesktop();
  if (isDesktop) return <AdminWorkerMeetingRoomsDesktop />;
  return <AdminWorkerMeetingRoomsMobile />;
}
