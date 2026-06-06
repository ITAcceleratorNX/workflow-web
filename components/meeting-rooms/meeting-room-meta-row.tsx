"use client";

import { Building2, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface MeetingRoomMetaRowProps {
  floor: number;
  capacity: number;
  roomType?: string;
  officeName?: string;
  showOffice?: boolean;
  darkTheme?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function MeetingRoomMetaRow({
  floor,
  capacity,
  roomType,
  officeName,
  showOffice = false,
  darkTheme = false,
  size = "sm",
  className,
}: MeetingRoomMetaRowProps) {
  const iconClass = cn(
    "shrink-0",
    size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
    darkTheme ? "text-[#F35713]" : "text-primary",
  );
  const textClass = cn(
    size === "sm" ? "text-sm" : "text-sm",
    darkTheme ? "text-[#8E8E93]" : "text-muted-foreground",
    className,
  );

  return (
    <div className={cn("flex flex-wrap gap-x-4 gap-y-1", textClass)}>
      <span className="flex items-center gap-1.5">
        <Building2 className={iconClass} />
        {floor} этаж
      </span>
      {roomType !== "cabinet" && (
        <span className="flex items-center gap-1.5">
          <Users className={iconClass} />
          {size === "md" ? `до ${capacity} человек` : `до ${capacity} чел.`}
        </span>
      )}
      {showOffice && officeName && (
        <span className="flex items-center gap-1.5">
          <MapPin className={iconClass} />
          <span className="truncate">{officeName}</span>
        </span>
      )}
    </div>
  );
}
