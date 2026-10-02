"use client";

import { useCallback, useState } from "react";
import api from "@/lib/api";
import { listLoadError } from "@/lib/request-list-loading";
import { useRequestStore } from "@/stores/useRequestStore";
import { confirmAction } from "@/stores/confirm-dialog-store";
import { useToast } from "@/hooks/use-toast";

type BulkDeleteResponse = { deletedIds: number[]; notFoundIds: number[] };

/** Сервер принимает не больше 100 id за запрос. */
const BULK_DELETE_CHUNK = 100;

function pluralRequests(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "заявку";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "заявки";
  return "заявок";
}

/**
 * Выбор и удаление заявок (одной или нескольких) для админа и офис-менеджера.
 * Удалённые заявки убираются из списков стора; onDeleted — чтобы закрыть открытую карточку.
 */
export function useRequestBulkDelete(onDeleted?: (ids: number[]) => void) {
  const { toast } = useToast();
  const { setIncomingRequests, setMyRequests } = useRequestStore();
  const [active, setActive] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [deleting, setDeleting] = useState(false);

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

  const removeFromLists = useCallback(
    (ids: number[]) => {
      const gone = new Set(ids);
      setIncomingRequests((prev) => prev.filter((r) => !gone.has(r.id)));
      setMyRequests((prev) => prev.filter((r) => !gone.has(r.id)));
      onDeleted?.(ids);
    },
    [setIncomingRequests, setMyRequests, onDeleted],
  );

  const deleteIds = useCallback(
    async (ids: number[]) => {
      if (ids.length === 0 || deleting) return false;
      const ok = await confirmAction({
        title: ids.length === 1 ? "Удалить заявку?" : `Удалить ${ids.length} ${pluralRequests(ids.length)}?`,
        message: "Заявки будут удалены вместе с подзаявками, фото и историей. Это действие нельзя отменить.",
        confirmLabel: "Удалить",
        cancelLabel: "Отмена",
        destructive: true,
      });
      if (!ok) return false;

      setDeleting(true);
      const deleted: number[] = [];
      try {
        for (let i = 0; i < ids.length; i += BULK_DELETE_CHUNK) {
          const { data } = await api.post<BulkDeleteResponse>("/request-groups/bulk-delete", {
            ids: ids.slice(i, i + BULK_DELETE_CHUNK),
          });
          deleted.push(...data.deletedIds);
        }
      } catch (failure) {
        toast({ title: "Не удалось удалить заявки", description: listLoadError(failure), variant: "destructive" });
      } finally {
        setDeleting(false);
      }

      if (deleted.length > 0) {
        removeFromLists(deleted);
        setSelectedIds((prev) => new Set([...prev].filter((id) => !deleted.includes(id))));
        const skipped = ids.length - deleted.length;
        toast({
          title: deleted.length === 1 ? "Заявка удалена" : `Удалено: ${deleted.length}`,
          description: skipped > 0 ? `Не удалось удалить: ${skipped} (нет доступа или уже удалены)` : undefined,
        });
        if (skipped === 0) setActive(false);
      }
      return deleted.length > 0;
    },
    [deleting, removeFromLists, toast],
  );

  const deleteSelected = useCallback(() => deleteIds([...selectedIds]), [deleteIds, selectedIds]);

  return { active, selectedIds, deleting, start, cancel, toggle, toggleAll, deleteSelected, deleteIds };
}

export type RequestBulkDelete = ReturnType<typeof useRequestBulkDelete>;
