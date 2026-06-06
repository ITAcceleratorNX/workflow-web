"use client";

import { useExecutorMeetingRooms } from "@/hooks/use-executor-meeting-rooms";
import { ExecutorMeetingRoomsDesktop } from "./executor-meeting-rooms-desktop";
import { ExecutorMeetingRoomsMobile } from "./executor-meeting-rooms-mobile";

export function ExecutorMeetingRoomsView() {
  const state = useExecutorMeetingRooms();

  if (state.isDesktop) {
    return <ExecutorMeetingRoomsDesktop {...state} />;
  }

  return <ExecutorMeetingRoomsMobile {...state} />;
}
