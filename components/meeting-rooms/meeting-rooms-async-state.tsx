"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MeetingRoomsLoadingStateProps {
  message: string;
  isDark?: boolean;
  className?: string;
}

export function MeetingRoomsLoadingState({
  message,
  isDark = false,
  className,
}: MeetingRoomsLoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-20", className)}>
      <Loader2
        className={cn(
          "h-8 w-8 animate-spin mb-4",
          isDark ? "text-[#F35713]" : "text-primary",
        )}
      />
      <p className={isDark ? "text-gray-400" : "text-muted-foreground"}>{message}</p>
    </div>
  );
}

interface MeetingRoomsErrorStateProps {
  error: string;
  className?: string;
}

export function MeetingRoomsErrorState({ error, className }: MeetingRoomsErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-20", className)}>
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <p className="text-destructive text-center">{error}</p>
    </div>
  );
}
