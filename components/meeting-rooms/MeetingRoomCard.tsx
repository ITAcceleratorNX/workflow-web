"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { MeetingRoom } from "@/stores/meetingRoomsStore";
import React from "react";
import { MeetingRoomMetaRow } from "./meeting-room-meta-row";
import { MeetingRoomPhotoCarousel } from "./meeting-room-photo-carousel";
import { MeetingRoomStatusBadge } from "./meeting-room-status-badge";

interface MeetingRoomCardProps {
  room: MeetingRoom;
  className?: string;
  footer?: React.ReactNode;
  highlightInactive?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  showOffice?: boolean;
  darkTheme?: boolean;
}

export function MeetingRoomCard({
  room,
  className,
  footer,
  highlightInactive = true,
  isExpanded = false,
  onToggleExpand,
  showOffice = false,
  darkTheme = false,
}: MeetingRoomCardProps) {
  const hasExpandableContent = (room.description || footer) && onToggleExpand;

  return (
    <Card
      className={cn(
        "overflow-hidden flex flex-row backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 w-full",
        darkTheme
          ? "bg-[#2C2C2E] border-[#3A3A3C]"
          : "bg-gradient-to-br from-white via-[#F3F3F3] to-white",
        highlightInactive && !room.isActive && "opacity-70",
        className,
      )}
    >
      <div
        className={cn(
          "relative w-40 shrink-0 aspect-[4/3]",
          darkTheme ? "bg-[#1C1C1E]" : "bg-muted",
        )}
      >
        <MeetingRoomPhotoCarousel
          photos={room.photos}
          altPrefix={room.name}
          darkTheme={darkTheme}
          size="card"
        />

        <MeetingRoomStatusBadge
          status={room.status}
          className="absolute top-1 left-1"
        />

        {!room.isActive && (
          <div className="absolute bottom-1 left-1 rounded-full bg-[#040404]/80 px-1.5 py-0.5 text-[10px] font-medium text-white z-10">
            На ремонте
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col min-w-0">
        <CardHeader className="space-y-1 py-2 px-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle
              className={cn(
                "text-base font-semibold flex-1 truncate",
                darkTheme && "text-white",
              )}
            >
              {room.name}
            </CardTitle>
            {hasExpandableContent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpand}
                className="h-7 w-7 p-0 shrink-0"
                aria-label={isExpanded ? "Свернуть" : "Развернуть"}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          <MeetingRoomMetaRow
            floor={room.floor}
            capacity={room.capacity}
            roomType={room.room_type}
            officeName={room.office?.name}
            showOffice={showOffice}
            darkTheme={darkTheme}
          />
          {isExpanded && room.description && (
            <p
              className={cn(
                "text-sm pt-1",
                darkTheme ? "text-[#8E8E93]" : "text-muted-foreground",
              )}
            >
              {room.description}
            </p>
          )}
        </CardHeader>

        {isExpanded && footer ? (
          <div className="px-3 pb-3 pt-0 mt-auto">
            <Separator className="mb-2" />
            {footer}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
