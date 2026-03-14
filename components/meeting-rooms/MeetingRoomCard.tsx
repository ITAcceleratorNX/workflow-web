"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Building2,
  Users,
  ImageIcon,
  ChevronDown,
  ChevronUp,
  MapPin,
} from "lucide-react";
import {
  MeetingRoom,
} from "@/stores/meetingRoomsStore";
import React from "react";

interface MeetingRoomCardProps {
  room: MeetingRoom;
  className?: string;
  footer?: React.ReactNode;
  highlightInactive?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  showOffice?: boolean;
  /** Dark theme for admin mobile */
  darkTheme?: boolean;
}

const statusVariant: Record<MeetingRoom["status"], string> = {
  available: "bg-gradient-to-r from-[#114A65] to-[#114A65]/90 text-white backdrop-blur-md border border-[#114A65]/50 shadow-lg font-bold",
  booked: "bg-gradient-to-r from-[#B8400E] to-[#B8400E]/90 text-white backdrop-blur-md border border-[#B8400E]/50 shadow-lg font-bold",
};

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
      {/* Фото слева */}
      <div className={cn("relative w-40 shrink-0 aspect-[4/3]", darkTheme ? "bg-[#1C1C1E]" : "bg-muted")}>
        {room.photos && room.photos.length > 0 ? (
          <Carousel
            opts={{ loop: true, align: "start" }}
            className="absolute inset-0 w-full h-full"
          >
            <CarouselContent className="-ml-0 h-full">
              {room.photos.map((photo, index) => (
                <CarouselItem key={index} className="pl-0 basis-full">
                  <div className="relative w-full h-full">
                    <img
                      src={photo}
                      alt={`${room.name} — фото ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {room.photos.length > 1 && (
              <>
                <CarouselPrevious className="left-1 h-5 w-5 rounded-full bg-black/50 hover:bg-black/70 text-white border-0" />
                <CarouselNext className="right-1 h-5 w-5 rounded-full bg-black/50 hover:bg-black/70 text-white border-0" />
                <div className="absolute bottom-1 right-1 rounded-full bg-black/75 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {room.photos.length}
                </div>
              </>
            )}
          </Carousel>
        ) : (
          <div className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-0.5",
            darkTheme ? "text-[#8E8E93]" : "text-muted-foreground"
          )}>
            <ImageIcon className="h-6 w-6" />
            <span className="text-[10px]">Нет фото</span>
          </div>
        )}

        <Badge
          className={cn(
            "absolute top-1 left-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold z-10",
            statusVariant[room.status],
          )}
        >
          {room.status === "available" ? "Доступна" : "Забронирована"}
        </Badge>

        {!room.isActive && (
          <div className="absolute bottom-1 left-1 rounded-full bg-[#040404]/80 px-1.5 py-0.5 text-[10px] font-medium text-white z-10">
            На ремонте
          </div>
        )}
      </div>

      {/* Данные справа */}
      <div className="flex flex-1 flex-col min-w-0">
        <CardHeader className="space-y-1 py-2 px-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className={cn("text-base font-semibold flex-1 truncate", darkTheme && "text-white")}>
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
          <div
            className={cn(
              "flex flex-wrap gap-x-4 gap-y-1 text-sm",
              darkTheme ? "text-[#8E8E93]" : "text-muted-foreground",
            )}
          >
            <span className="flex items-center gap-1.5">
              <Building2 className={cn("h-3.5 w-3.5 shrink-0", darkTheme ? "text-[#F35713]" : "text-primary")} />
              {room.floor} этаж
            </span>
            {room.room_type !== "cabinet" && (
              <span className="flex items-center gap-1.5">
                <Users className={cn("h-3.5 w-3.5 shrink-0", darkTheme ? "text-[#F35713]" : "text-primary")} />
                до {room.capacity} чел.
              </span>
            )}
            {showOffice && room.office && (
              <span className="flex items-center gap-1.5">
                <MapPin className={cn("h-3.5 w-3.5 shrink-0", darkTheme ? "text-[#F35713]" : "text-primary")} />
                <span className="truncate">{room.office.name}</span>
              </span>
            )}
          </div>
          {isExpanded && room.description && (
            <p className={cn("text-sm pt-1", darkTheme ? "text-[#8E8E93]" : "text-muted-foreground")}>
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

