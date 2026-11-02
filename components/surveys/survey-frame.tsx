"use client";

import { ChevronLeft } from "lucide-react";
import { createContext, useContext, type ReactNode } from "react";
import { ActionBar } from "@/components/ui/action-bar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SurveyLayout = "mobile" | "desktop";

/** Actions of the Desktop survey card (Figma: 42 px, radius 10, 14 px) on the kit's `md` size. */
export const DESKTOP_ACTION = "rounded-[10px] px-4 text-sm";

const PreviewBanner = createContext<ReactNode>(null);

/**
 * The preview of the Administrator (Figma «Предпросмотр»): the screens of the client under a banner.
 * On Mobile the banner tops each screen; on Desktop the card stands alone, in a window or in the
 * middle of a page, with the banner as its top edge.
 */
export function SurveyPreviewFrame({ banner, children }: { banner: ReactNode; children: ReactNode }) {
  return <PreviewBanner.Provider value={banner}>{children}</PreviewBanner.Provider>;
}

/** Inside the preview: its banner; null on the screens of the client. */
export const useSurveyPreviewBanner = () => useContext(PreviewBanner);

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
  const banner = useSurveyPreviewBanner();
  const top = "pt-[max(0.75rem,env(safe-area-inset-top))]";
  return (
    <div className="flex min-h-[100dvh] flex-col bg-ui-canvas text-ui-fg">
      {banner ? <div className={cn("px-4", top)}>{banner}</div> : null}
      <div
        className={cn(
          "flex flex-1 flex-col gap-3.5 px-4 pb-6",
          banner ? "pt-3.5" : top,
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
  const banner = useSurveyPreviewBanner();
  if (banner) {
    return (
      <div className="flex w-full flex-col overflow-hidden rounded-4pt-lg border border-ui-fg/10 bg-ui-raised text-ui-fg">
        {banner}
        <div className="flex flex-col gap-4 p-8">{children}</div>
      </div>
    );
  }
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
