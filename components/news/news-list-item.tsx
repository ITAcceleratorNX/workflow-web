"use client";

import type { ReactNode } from "react";
import { ChevronRight, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsListItemProps {
  title: string;
  tag?: string;
  dateLabel?: string | null;
  description?: string;
  imageUrl?: string | null;
  rightSlot?: ReactNode;
  footerSlot?: ReactNode;
  onPress?: () => void;
  className?: string;
}

/** Карточка новости — parity с workflow-mobile NewsListItem. */
export function NewsListItem({
  title,
  tag = "Новость",
  dateLabel,
  description,
  imageUrl,
  rightSlot,
  footerSlot,
  onPress,
  className,
}: NewsListItemProps) {
  const topBlock = (
    <>
      <div className="relative w-full aspect-video bg-[#0B1220]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-[34px] w-[34px] text-[#8E8E93]" />
          </div>
        )}
        {rightSlot ? <div className="absolute right-2.5 top-2.5">{rightSlot}</div> : null}
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2.5">
          <span className="text-[11px] font-bold text-white px-2.5 py-1 rounded-full bg-[#F35713]">
            {tag}
          </span>
          {dateLabel ? (
            <span className="text-xs text-[#8E8E93] truncate">{dateLabel}</span>
          ) : null}
        </div>
        <h3 className="text-base font-extrabold leading-5 text-white line-clamp-2">{title}</h3>
        {description ? (
          <p className="text-[13px] leading-[18px] text-[#8E8E93] line-clamp-3">{description}</p>
        ) : null}
      </div>
    </>
  );

  return (
    <div
      className={cn(
        "rounded-2xl border border-[#3A3A3C] bg-[#2C2C2E] overflow-hidden",
        className,
      )}
    >
      {onPress ? (
        <button type="button" onClick={onPress} className="w-full text-left active:opacity-90">
          {topBlock}
        </button>
      ) : (
        topBlock
      )}
      {footerSlot ? <div className="px-3 pt-3 pb-3 border-t border-[#3A3A3C]">{footerSlot}</div> : null}
    </div>
  );
}
