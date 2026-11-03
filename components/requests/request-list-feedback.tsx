"use client";

import { Inbox, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  RQ_DESKTOP_BUTTON,
  RQ_DESKTOP_BUTTON_ICON,
  RQ_DESKTOP_CARD,
  RQ_DESKTOP_LIST_DIVIDED,
  RQ_DESKTOP_SKELETON,
} from "@/constants/requests-desktop-ui";
import { cn } from "@/lib/utils";

export interface RequestListFeedbackProps {
  loading: boolean;
  error: string | null;
  isFiltered: boolean;
  onRetry: () => void;
  onResetFilters: () => void;
}

interface FeedbackViewProps extends RequestListFeedbackProps {
  count: number;
  emptyMessage?: string;
  /** Подсказка под «По выбранным фильтрам заявок нет» (десктоп): какие фильтры менять. */
  emptyFilteredHint?: string;
}

const FILTERED_EMPTY_TITLE = "По выбранным фильтрам заявок нет";
const SKELETON_ROWS = 9;

export function RequestListFeedback({
  variant = "mobile",
  ...props
}: FeedbackViewProps & { variant?: "mobile" | "desktop" }) {
  return variant === "desktop" ? <DesktopFeedback {...props} /> : <MobileFeedback {...props} />;
}

function MobileFeedback({
  loading, error, isFiltered, onRetry, onResetFilters, count, emptyMessage = "Заявок пока нет",
}: FeedbackViewProps) {
  if (error) return (
    <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-foreground">
      <p>{error}</p>
      {count > 0 && <p className="mt-1 text-sm text-muted-foreground">Показаны данные последней успешной загрузки.</p>}
      <Button className="mt-3" variant="outline" disabled={loading} onClick={onRetry}>Повторить</Button>
    </div>
  );
  if (loading) return <p role="status" className="py-6 text-center text-muted-foreground">{count ? "Обновляем заявки…" : "Загрузка заявок…"}</p>;
  if (count > 0) return null;
  return (
    <div role="status" className="py-10 text-center text-muted-foreground">
      <p>{isFiltered ? FILTERED_EMPTY_TITLE : emptyMessage}</p>
      {isFiltered && <Button className="mt-3" variant="outline" onClick={onResetFilters}>Сбросить фильтры</Button>}
    </div>
  );
}

/** Макет «Заявки»: скелетон строк при загрузке, карточка пустой выборки со сбросом фильтров. */
function DesktopFeedback({
  loading,
  error,
  isFiltered,
  onRetry,
  onResetFilters,
  count,
  emptyMessage = "Заявок пока нет",
  emptyFilteredHint = "Измените фильтры — или сбросьте их",
}: FeedbackViewProps) {
  if (error) return (
    <div role="alert" className={cn(RQ_DESKTOP_CARD, "mb-3 border-[#5A2323] px-5 py-4 text-ui-fg")}>
      <p className="text-[15px] font-semibold">{error}</p>
      {count > 0 && <p className="mt-1 text-[13px] text-[#A1A1A6]">Показаны данные последней успешной загрузки.</p>}
      <button type="button" className={cn(RQ_DESKTOP_BUTTON, "mt-3")} disabled={loading} onClick={onRetry}>
        <RotateCcw className={RQ_DESKTOP_BUTTON_ICON} aria-hidden />
        Повторить
      </button>
    </div>
  );
  if (loading) {
    return (
      <>
        <p role="status" className="text-[13px] leading-[18px] text-[#A1A1A6]">
          {count ? "Обновляем заявки…" : "Загрузка заявок…"}
        </p>
        {count === 0 && <RequestRowsSkeleton />}
      </>
    );
  }
  if (count > 0) return null;
  return (
    <div role="status" className={cn(RQ_DESKTOP_CARD, "flex flex-col items-center px-6 py-[72px] text-center")}>
      <span className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-[#1F1F21]">
        <Inbox className="h-6 w-6 text-[#8E8E93]" aria-hidden />
      </span>
      <p className="mt-3 text-lg font-semibold text-ui-fg">{isFiltered ? FILTERED_EMPTY_TITLE : emptyMessage}</p>
      {isFiltered && (
        <>
          <p className="mt-2 max-w-[390px] text-[15px] leading-[21px] text-[#A1A1A6]">{emptyFilteredHint}</p>
          <button type="button" className={cn(RQ_DESKTOP_BUTTON, "mt-5")} onClick={onResetFilters}>
            <RotateCcw className={RQ_DESKTOP_BUTTON_ICON} aria-hidden />
            Сбросить фильтры
          </button>
        </>
      )}
    </div>
  );
}

/** Строки-заглушки той же высоты, что и строки списка: при загрузке список не прыгает. */
function RequestRowsSkeleton() {
  return (
    <div aria-hidden className={cn(RQ_DESKTOP_LIST_DIVIDED, "mt-3")}>
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <div key={index} className="flex items-center gap-4 px-1 py-2">
          <div className={cn(RQ_DESKTOP_SKELETON, "h-[60px] w-[60px] shrink-0 rounded-[10px]")} />
          <div className={cn(RQ_DESKTOP_SKELETON, "h-3 w-12 rounded-full")} />
          <div className={cn(RQ_DESKTOP_SKELETON, "h-3 w-[130px] rounded-full")} />
          <div className={cn(RQ_DESKTOP_SKELETON, "ml-24 h-3 w-[220px] rounded-full")} />
          <div className={cn(RQ_DESKTOP_SKELETON, "ml-auto h-3 w-[90px] rounded-full")} />
        </div>
      ))}
    </div>
  );
}
