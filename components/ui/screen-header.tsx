"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsDesktop } from "@/hooks/use-media-query";

export interface ScreenHeaderProps {
  title: string;
  /** Подзаголовок под title (только если не inlineTitle). */
  subtitle?: string;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
  /** Скрыть текст «Назад», оставить только иконку */
  hideBackLabel?: boolean;
  /** Title в одной строке с кнопкой назад */
  inlineTitle?: boolean;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  backClassName?: string;
}

/**
 * Mobile-only заголовок экрана (workflow-mobile ScreenHeader).
 * На desktop (≥768px) не рендерится — используйте desktop shell header.
 */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  rightSlot,
  hideBackLabel = false,
  inlineTitle = false,
  className,
  titleClassName,
  subtitleClassName,
  backClassName,
}: ScreenHeaderProps) {
  const router = useRouter();
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return null;
  }

  const handleBack = onBack ?? (() => router.back());

  return (
    <header className={cn("px-4pt-lg pb-4pt-md", className)}>
      <div
        className={cn(
          "relative flex items-center justify-start",
          inlineTitle ? "pb-1.5" : "mb-4pt-sm"
        )}
      >
        <button
          type="button"
          onClick={handleBack}
          className={cn(
            "inline-flex min-h-11 min-w-11 items-center text-primary -ml-1",
            backClassName
          )}
          aria-label="Назад"
        >
          <ChevronLeft className="h-7 w-7 shrink-0" strokeWidth={2.5} />
          {!hideBackLabel && (
            <span className="text-base font-medium ml-0.5">Назад</span>
          )}
        </button>

        {inlineTitle ? (
          <h1
            className={cn(
              "flex-1 ml-4pt-sm text-xl font-extrabold leading-tight truncate",
              titleClassName
            )}
          >
            {title}
          </h1>
        ) : null}

        {rightSlot ? (
          <div
            className={cn(
              inlineTitle ? "ml-4pt-sm self-center" : "absolute right-4 top-0"
            )}
          >
            {rightSlot}
          </div>
        ) : null}
      </div>

      {!inlineTitle ? (
        <>
          <h1 className={cn("text-xl font-bold leading-tight", titleClassName)}>
            {title}
          </h1>
          {subtitle ? (
            <p
              className={cn(
                "mt-1.5 text-sm leading-[21px] text-muted-foreground",
                subtitleClassName
              )}
            >
              {subtitle}
            </p>
          ) : null}
        </>
      ) : null}
    </header>
  );
}
