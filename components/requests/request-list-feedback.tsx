"use client";

import { Button } from "@/components/ui/button";

export interface RequestListFeedbackProps {
  loading: boolean;
  error: string | null;
  isFiltered: boolean;
  onRetry: () => void;
  onResetFilters: () => void;
}

export function RequestListFeedback({
  loading, error, isFiltered, onRetry, onResetFilters, count, emptyMessage = "Заявок пока нет",
}: RequestListFeedbackProps & { count: number; emptyMessage?: string }) {
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
      <p>{isFiltered ? "По выбранным фильтрам заявок нет" : emptyMessage}</p>
      {isFiltered && <Button className="mt-3" variant="outline" onClick={onResetFilters}>Сбросить фильтры</Button>}
    </div>
  );
}
