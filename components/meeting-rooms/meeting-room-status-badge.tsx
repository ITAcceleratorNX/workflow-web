"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MeetingRoom } from "@/stores/meetingRoomsStore";
import {
  MEETING_ROOM_STATUS_BADGE_CLASSES,
  MEETING_ROOM_STATUS_LABELS,
} from "./meeting-rooms-constants";

interface MeetingRoomStatusBadgeProps {
  status: MeetingRoom["status"];
  className?: string;
  size?: "sm" | "md";
}

export function MeetingRoomStatusBadge({
  status,
  className,
  size = "sm",
}: MeetingRoomStatusBadgeProps) {
  return (
    <Badge
      className={cn(
        "rounded-full font-semibold z-10",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-3 py-1 text-xs shadow-lg",
        MEETING_ROOM_STATUS_BADGE_CLASSES[status],
        className,
      )}
    >
      {MEETING_ROOM_STATUS_LABELS[status]}
    </Badge>
  );
}
