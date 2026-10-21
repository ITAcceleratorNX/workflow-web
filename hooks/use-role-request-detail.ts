"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { buildRequestsListPath, buildRequestsUrlWithId } from "@/lib/requestNavigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import api from "@/lib/api";
import type { RequestGroup } from "@/stores/useRequestStore";

interface UseRoleRequestDetailOptions {
  /** Заявка без сервера (демо-заявки Клиента с отрицательным id); undefined — грузить с сервера. */
  findLocal?: (id: number) => RequestGroup | null | undefined;
}

/**
 * Страница заявки на mobile для любой роли (`/<role>/requests/[id]`): на desktop переводит в список
 * с открытой заявкой, на mobile загружает заявку; «Назад» и «Заявка обновлена» ведут в список роли.
 * Роли с действиями (Офис-менеджер, Исполнитель) строят их поверх `reload` и `setRequest`.
 */
export function useRoleRequestDetail(basePath: string, { findLocal }: UseRoleRequestDetailOptions = {}) {
  const router = useRouter();
  const params = useParams();
  const currentSearch = useSearchParams().toString();
  const id = params?.id as string;
  const isDesktop = useIsDesktop();
  const [request, setRequest] = useState<RequestGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDesktop && id) {
      router.replace(buildRequestsUrlWithId(basePath, id, currentSearch));
    }
  }, [basePath, isDesktop, router, id, currentSearch]);

  /** Перечитать заявку с сервера (после действий над ней). */
  const reload = useCallback(async () => {
    if (!id) return;
    try {
      const response = await api.get(`/request-groups/${id}`);
      setRequest(response.data);
    } catch (err) {
      console.error("Ошибка загрузки заявки:", err);
      setError("Не удалось загрузить заявку");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id || isDesktop) return;
    if (findLocal) {
      const local = findLocal(parseInt(id, 10));
      if (local !== undefined) {
        setRequest(local);
        setError(local ? null : "Заявка не найдена");
        setLoading(false);
        return;
      }
    }
    setLoading(true);
    setError(null);
    void reload();
  }, [id, isDesktop, findLocal, reload]);

  const handleClose = useCallback(() => {
    router.push(buildRequestsListPath(basePath, currentSearch));
  }, [basePath, router, currentSearch]);

  return {
    id,
    isDesktop,
    request,
    setRequest,
    loading,
    error,
    reload,
    handleClose,
    /** По умолчанию после изменения заявки — назад в список. */
    handleRequestUpdated: handleClose,
  };
}

export type UseRoleRequestDetailResult = ReturnType<typeof useRoleRequestDetail>;
