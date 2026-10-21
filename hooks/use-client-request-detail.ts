"use client";

import { useCallback } from "react";
import { useRoleRequestDetail } from "@/hooks/use-role-request-detail";
import { useRequestStore } from "@/stores/useRequestStore";

/** Заявка Клиента: демо-заявки (отрицательный id) берутся из стора, остальные — с сервера. */
export function useClientRequestDetail() {
  const requests = useRequestStore((s) => s.requests);
  const findLocal = useCallback(
    (id: number) => (id < 0 ? (requests.find((r) => r.id === id) ?? null) : undefined),
    [requests],
  );
  return useRoleRequestDetail("/client/requests", { findLocal });
}

export type UseClientRequestDetailResult = ReturnType<typeof useClientRequestDetail>;
