"use client";

import { useCallback, useState } from "react";
import api from "@/lib/api";
import { listLoadError } from "@/lib/request-list-loading";
import { useToast } from "@/hooks/use-toast";

type BulkDeleteResponse = { deletedIds: number[]; notFoundIds: number[] };

/** Сервер принимает не больше 100 id за запрос. */
const BULK_DELETE_CHUNK = 100;

/**
 * Выбор и логическое удаление заявок (одной или нескольких) — только Руководитель платформы.
 * Удаление подтверждается в окне с необязательной причиной; onDeleted — убрать удалённые
 * заявки из списков и закрыть открытую карточку.
 */
export function useRequestBulkDelete(onDeleted: (ids: number[]) => void) {
  const { toast } = useToast();
  const [active, setActive] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [deleting, setDeleting] = useState(false);
  /** Заявки, ждущие подтверждения в окне удаления; null — окно закрыто. */
  const [pendingIds, setPendingIds] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(() => setActive(true), []);

  const cancel = useCallback(() => {
    setActive(false);
    setSelectedIds(new Set());
  }, []);

  const toggle = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /** Выбрать все из видимых; если все уже выбраны — снять выбор. */
  const toggleAll = useCallback((ids: number[]) => {
    setSelectedIds((prev) => (ids.length > 0 && ids.every((id) => prev.has(id)) ? new Set() : new Set(ids)));
  }, []);

  const askDelete = useCallback((ids: number[]) => {
    if (ids.length === 0) return;
    setError(null);
    setPendingIds(ids);
  }, []);

  const closeDialog = useCallback(() => {
    if (!deleting) setPendingIds(null);
  }, [deleting]);

  const confirmDelete = useCallback(
    async (reason: string | null) => {
      const ids = pendingIds;
      if (!ids || ids.length === 0 || deleting) return;

      setDeleting(true);
      setError(null);
      const deleted: number[] = [];
      try {
        for (let i = 0; i < ids.length; i += BULK_DELETE_CHUNK) {
          const { data } = await api.post<BulkDeleteResponse>("/request-groups/bulk-delete", {
            ids: ids.slice(i, i + BULK_DELETE_CHUNK),
            reason,
          });
          deleted.push(...data.deletedIds);
        }
      } catch (failure) {
        setError(`Не удалось удалить заявки. ${listLoadError(failure)}`);
      } finally {
        setDeleting(false);
      }

      if (deleted.length > 0) {
        onDeleted(deleted);
        setSelectedIds((prev) => new Set([...prev].filter((id) => !deleted.includes(id))));
        const skipped = ids.length - deleted.length;
        toast({
          title: deleted.length === 1 ? "Заявка удалена" : `Удалено: ${deleted.length}`,
          description: skipped > 0 ? `Не удалось удалить: ${skipped} (уже удалены)` : "Запись сохранена в журнале удалений",
        });
        if (skipped === 0) setActive(false);
        setPendingIds(null);
      }
    },
    [pendingIds, deleting, onDeleted, toast],
  );

  const deleteSelected = useCallback(() => askDelete([...selectedIds]), [askDelete, selectedIds]);

  return {
    active,
    selectedIds,
    deleting,
    pendingIds,
    error,
    start,
    cancel,
    toggle,
    toggleAll,
    deleteSelected,
    askDelete,
    closeDialog,
    confirmDelete,
  };
}

export type RequestBulkDelete = ReturnType<typeof useRequestBulkDelete>;
