"use client";

import { useRouter } from "next/navigation";
import PullToRefresh from "@/components/pull-to-refresh";
import { ScreenHeader } from "@/components/ui/screen-header";
import { MOBILE_BOOKING_GRADIENT } from "@/constants/mobile-theme";
import { cn } from "@/lib/utils";

export type MobilePageBackground = "default" | "booking";

export interface MobilePageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Pull-to-refresh handler; если не передан — без обёртки PTR */
  onRefresh?: () => Promise<void>;
  onBack?: () => void;
  backHref?: string;
  rightSlot?: React.ReactNode;
  hideBackLabel?: boolean;
  inlineTitle?: boolean;
  background?: MobilePageBackground;
  /** Доп. padding снизу под BottomNav (если родительский layout его не даёт) */
  padForBottomNav?: boolean;
  className?: string;
  contentClassName?: string;
}

/**
 * Единый mobile page wrapper: ScreenHeader, PullToRefresh, safe-area, background.
 * Desktop (≥768px): ScreenHeader скрыт; контент рендерится для redirect/shell pages.
 */
export function MobilePageLayout({
  title,
  subtitle,
  children,
  onRefresh,
  onBack,
  backHref,
  rightSlot,
  hideBackLabel,
  inlineTitle,
  background = "default",
  padForBottomNav = false,
  className,
  contentClassName,
}: MobilePageLayoutProps) {
  const router = useRouter();

  const handleBack =
    onBack ??
    (backHref ? () => router.push(backHref) : () => router.back());

  const inner = (
    <div
      className={cn(
        "min-h-screen pt-[env(safe-area-inset-top,0px)]",
        background === "default" && "bg-background",
        padForBottomNav && "pb-[calc(52px+max(env(safe-area-inset-bottom,0px),10px))]",
        className
      )}
      style={
        background === "booking"
          ? { background: MOBILE_BOOKING_GRADIENT }
          : undefined
      }
    >
      <div
        className={cn(
          "w-full max-w-7xl mx-auto px-4 py-6",
          contentClassName
        )}
      >
        <ScreenHeader
          title={title}
          subtitle={subtitle}
          onBack={handleBack}
          rightSlot={rightSlot}
          hideBackLabel={hideBackLabel}
          inlineTitle={inlineTitle}
          titleClassName="text-foreground"
          backClassName="text-primary"
          className="px-0 pb-4pt-md"
        />
        {children}
      </div>
    </div>
  );

  if (onRefresh) {
    return <PullToRefresh onRefresh={onRefresh}>{inner}</PullToRefresh>;
  }

  return inner;
}
