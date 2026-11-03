"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type InfoBannerProps = {
  icon: ReactNode;
  /** The message. */
  children: ReactNode;
  /** A text action at the end: «Закрыть». */
  action?: { label: string; onClick: () => void };
  /** `card` — a box among the content (Mobile); `strip` — the top edge of a window (Desktop). */
  variant?: "card" | "strip";
  className?: string;
};

/**
 * A blue notice about the screen itself (Figma «Предпросмотр — так опрос увидит клиент»): an icon,
 * the message and an action. Not an error and not a result — a hint of where the user is.
 */
export function InfoBanner({ icon, children, action, variant = "card", className }: InfoBannerProps) {
  const strip = variant === "strip";
  return (
    <div
      className={cn(
        "flex items-center bg-ui-info-soft text-ui-info-on-soft",
        strip ? "gap-2.5 border-b border-ui-info/20 px-5 py-3 text-sm leading-5" : "gap-3 rounded-[14px] border border-ui-info/20 p-3 text-[13.5px] leading-[18px]",
        className,
      )}
    >
      <span aria-hidden className="shrink-0 text-ui-info [&_svg]:size-[18px]">
        {icon}
      </span>
      <p className="min-w-0 flex-1">{children}</p>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className={cn(
            "shrink-0 rounded-4pt-xs font-semibold text-ui-info transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-info/70",
            strip ? "text-sm" : "text-[15px]",
          )}
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
