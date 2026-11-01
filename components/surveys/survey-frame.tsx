"use client";

import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { ActionBar } from "@/components/ui/action-bar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SurveyLayout = "mobile" | "desktop";

/** Actions of the Desktop survey card (Figma: 42 px, radius 10, 14 px) on the kit's `md` size. */
export const DESKTOP_ACTION = "rounded-[10px] px-4 text-sm";

type SurveyMobileScreenProps = {
  children: ReactNode;
  /** The bottom bar: «Начать», «Назад / Далее», «К опросам». */
  actions?: ReactNode;
  actionsLayout?: "row" | "column";
  /** A result: the content in the middle of the screen. */
  centered?: boolean;
};

/** A phone screen of a survey (no tab bar): the content from the top, the actions at the bottom. */
export function SurveyMobileScreen({ children, actions, actionsLayout, centered = false }: SurveyMobileScreenProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-ui-canvas text-ui-fg">
      <div
        className={cn(
          "flex flex-1 flex-col gap-3.5 px-4 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]",
          centered && "justify-center pb-24",
        )}
      >
        {children}
      </div>
      {actions ? <ActionBar layout={actionsLayout}>{actions}</ActionBar> : null}
    </div>
  );
}

type SurveyDesktopScreenProps = {
  children: ReactNode;
  /** Above the card: «Назад». */
  top?: ReactNode;
  /** A result: a narrower card. */
  narrow?: boolean;
};

/** A survey on Desktop: a card in the middle of the content area (Figma 720 px, a result 640 px). */
export function SurveyDesktopScreen({ children, top, narrow = false }: SurveyDesktopScreenProps) {
  return (
    <div className="flex flex-col gap-[18px] px-10 pb-12 pt-8 text-ui-fg">
      {top}
      <div className="flex justify-center pt-2">
        <div
          className={cn(
            "flex w-full flex-col gap-4 rounded-4pt-lg border border-ui-fg/10 bg-ui-raised p-8",
            narrow ? "max-w-[640px]" : "max-w-[720px]",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/** «Повторить» under a loading error of the surveys or of one survey (as at the tasks). */
export function SurveyRetryButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="accent-outline" className="h-10 rounded-xl px-[18px] text-[15px]" onClick={onClick}>
      Повторить
    </Button>
  );
}

/** «Назад» above the intro (Figma: an accent link with a chevron). */
export function SurveyBackButton({ layout, onClick }: { layout: SurveyLayout; onClick: () => void }) {
  const desktop = layout === "desktop";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex w-fit items-center text-ui-accent transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70",
        desktop ? "gap-2 rounded-4pt-xs text-[15px] leading-[18px]" : "-ml-1 h-11 gap-1.5 rounded-4pt-sm px-1 text-[17px] leading-[21px]",
      )}
    >
      <ChevronLeft aria-hidden className={desktop ? "size-[18px]" : "size-5"} />
      Назад
    </button>
  );
}
