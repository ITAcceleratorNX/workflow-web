"use client";

import { cn } from "@/lib/utils";
import {
  NOTIFICATION_CATEGORY_META,
  formatBadgeCount,
  formatCategoryTime,
  orderCategoriesByActivity,
  type CategorySummaryItem,
  type NotificationCategory,
} from "@/lib/notification-categories";
import { CategoryIcon } from "./category-visuals";

/**
 * Список категорий: экран «Уведомления» на Mobile, левая колонка раздела и поповер колокольчика
 * на Desktop. Порядок — по последнему событию, пустые категории в конце с «Пока нет уведомлений».
 */
type Variant = "mobile" | "page" | "popover";

const STYLES: Record<Variant, {
  list: string;
  row: string;
  activeRow: string;
  icon: "sm" | "md" | "lg";
  title: string;
  preview: string;
  emptyPreview: string;
  previewLines: string;
  time: string;
  accent: string;
  divider: string;
}> = {
  mobile: {
    list: "overflow-hidden rounded-[20px] bg-[#1C1C1E]",
    row: "px-4 py-3.5 gap-3",
    activeRow: "",
    icon: "lg",
    title: "text-base font-semibold leading-[21px]",
    preview: "text-sm leading-[19px] text-[#D4D4D8]",
    emptyPreview: "text-sm leading-[19px] text-[#71717A]",
    previewLines: "line-clamp-2",
    time: "text-xs",
    accent: "#F35713",
    divider: "ml-[76px] h-px bg-white/[0.08]",
  },
  page: {
    list: "flex flex-col gap-1 rounded-xl border border-[#39393C] bg-[#2A2A2C] p-2",
    row: "rounded-[10px] p-3 gap-3 hover:bg-white/[0.04]",
    activeRow: "bg-[#E85D2B]/[0.12] hover:bg-[#E85D2B]/[0.12]",
    icon: "md",
    title: "text-sm font-semibold leading-[17px]",
    preview: "text-xs leading-4 text-[#D1D5DB]",
    emptyPreview: "text-xs leading-4 text-[#6B7280]",
    previewLines: "line-clamp-1",
    time: "text-[11px]",
    accent: "#E85D2B",
    divider: "",
  },
  popover: {
    list: "py-1",
    row: "px-4 py-3 gap-3 border-b border-white/[0.05] last:border-b-0 hover:bg-white/[0.04]",
    activeRow: "",
    icon: "sm",
    title: "text-sm font-semibold leading-[17px]",
    preview: "text-xs leading-4 text-[#D1D5DB]",
    emptyPreview: "text-xs leading-4 text-[#6B7280]",
    previewLines: "line-clamp-2",
    time: "text-[11px]",
    accent: "#E85D2B",
    divider: "",
  },
};

export function NotificationCategoryList({
  categories,
  variant,
  activeCategory,
  onSelect,
}: {
  categories: CategorySummaryItem[];
  variant: Variant;
  activeCategory?: NotificationCategory | null;
  onSelect: (category: NotificationCategory) => void;
}) {
  const style = STYLES[variant];
  const ordered = orderCategoriesByActivity(categories);

  return (
    <ul className={style.list}>
      {ordered.map((item, index) => {
        const meta = NOTIFICATION_CATEGORY_META[item.category];
        const last = item.last_notification;
        const unread = item.unread_count;
        const active = item.category === activeCategory;
        return (
          <li key={item.category}>
            {variant === "mobile" && index > 0 && <div className={style.divider} aria-hidden />}
            <button
              type="button"
              onClick={() => onSelect(item.category)}
              aria-current={active ? "true" : undefined}
              className={cn(
                "flex w-full items-center text-left transition-colors",
                style.row,
                active && style.activeRow,
              )}
            >
              <CategoryIcon category={item.category} muted={!last} size={style.icon} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className={cn(style.title, last ? "text-white" : "text-white/50")}>{meta.label}</span>
                <span className={cn(last ? style.preview : style.emptyPreview, last && style.previewLines)}>
                  {last ? last.content : "Пока нет уведомлений"}
                </span>
              </span>
              {last && (
                <span className="flex shrink-0 flex-col items-end gap-1.5 self-start pt-0.5">
                  <span className={style.time} style={{ color: unread > 0 ? style.accent : "#8E8E93" }}>
                    {formatCategoryTime(last.created_at)}
                  </span>
                  {unread > 0 && (
                    <span
                      className="flex h-[18px] min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold leading-none text-white"
                      style={{ backgroundColor: style.accent }}
                      aria-label={`Непрочитанных: ${unread}`}
                    >
                      {formatBadgeCount(unread)}
                    </span>
                  )}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
