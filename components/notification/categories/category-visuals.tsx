"use client";

import { CalendarClock, ClipboardList, UserPlus, Wrench, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NOTIFICATION_CATEGORY_META,
  splitRequestNumbers,
  type CategoryNotification,
  type NotificationCategory,
} from "@/lib/notification-categories";

/** Иконка и цвет категории по макету; tasks в пустом состоянии — зелёный (#10B981). */
const CATEGORY_VISUAL: Record<NotificationCategory, { icon: LucideIcon; color: string; bg: string }> = {
  service_requests: { icon: Wrench, color: "text-[#F35713]", bg: "bg-[#F35713]/20" },
  meeting_rooms: { icon: CalendarClock, color: "text-[#2A9D8F]", bg: "bg-[#2A9D8F]/20" },
  tasks: { icon: ClipboardList, color: "text-[#10B981]", bg: "bg-[#10B981]/20" },
  registrations: { icon: UserPlus, color: "text-[#60A5FA]", bg: "bg-[#60A5FA]/20" },
};

const ICON_SIZE = {
  sm: { box: "h-9 w-9", icon: "h-[18px] w-[18px]" },
  md: { box: "h-10 w-10", icon: "h-5 w-5" },
  lg: { box: "h-12 w-12", icon: "h-[22px] w-[22px]" },
  xl: { box: "h-14 w-14", icon: "h-7 w-7" },
  xxl: { box: "h-16 w-16", icon: "h-[30px] w-[30px]" },
} as const;

export function CategoryIcon({
  category,
  muted = false,
  size = "md",
}: {
  category: NotificationCategory;
  /** Категория без уведомлений — серая иконка. */
  muted?: boolean;
  size?: keyof typeof ICON_SIZE;
}) {
  const visual = CATEGORY_VISUAL[category];
  const Icon = visual.icon;
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        ICON_SIZE[size].box,
        muted ? "bg-[#3F3F46]/50" : visual.bg,
      )}
      aria-hidden
    >
      <Icon className={cn(ICON_SIZE[size].icon, muted ? "text-[#71717A]" : visual.color)} strokeWidth={1.75} />
    </span>
  );
}

/** Пустая история категории. */
export function CategoryEmptyState({
  category,
  className,
  size = "xxl",
}: {
  category: NotificationCategory;
  className?: string;
  size?: "xl" | "xxl";
}) {
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <CategoryIcon category={category} size={size} />
      <p className="mt-3 text-base font-medium text-white">Пока нет уведомлений</p>
      <p className="mt-1 max-w-[320px] text-sm leading-5 text-[#A1A1AA]">
        {NOTIFICATION_CATEGORY_META[category].emptyHint}
      </p>
    </div>
  );
}

/**
 * Текст уведомления. Номер заявки — ссылка только там, где переход существует (Сервисные
 * заявки); в остальных категориях текст выводится как есть.
 */
export function NotificationText({
  notification,
  onRequestClick,
  linkClassName = "text-[#F35713]",
}: {
  notification: CategoryNotification;
  onRequestClick?: (requestId: string) => void;
  linkClassName?: string;
}) {
  const category = notification.category;
  if (!category || !NOTIFICATION_CATEGORY_META[category].linksRequests || !onRequestClick) {
    return <>{notification.content}</>;
  }
  return (
    <>
      {splitRequestNumbers(notification.content).map((segment, index) =>
        segment.type === "text" ? (
          <span key={index}>{segment.value}</span>
        ) : (
          <button
            key={index}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRequestClick(segment.value);
            }}
            className={cn("font-medium underline underline-offset-2 hover:opacity-80", linkClassName)}
          >
            № {segment.value}
          </button>
        ),
      )}
    </>
  );
}
