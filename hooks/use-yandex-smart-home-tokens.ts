"use client";

import { useCallback, useEffect, useState } from "react";
import { deleteYandexTokens, getYandexTokens, refreshYandexTokens } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface YandexTokenMeta {
  id: number;
  expires_at: string | null;
  created_at?: string;
  updated_at?: string;
  has_tokens?: boolean;
}

export function useYandexSmartHomeTokens(options?: { confirmDelete?: boolean }) {
  const { toast } = useToast();
  const confirmDelete = options?.confirmDelete ?? true;

  const [tokensMeta, setTokensMeta] = useState<YandexTokenMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenAction, setTokenAction] = useState<"refresh" | "delete" | null>(null);

  const loadTokens = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getYandexTokens();
      setTokensMeta(response.data ?? null);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setTokensMeta(null);
      } else {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Ошибка при загрузке информации о токенах";
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTokens();
  }, [loadTokens]);

  const handleRefreshTokens = useCallback(async () => {
    setTokenAction("refresh");
    setError(null);
    try {
      await refreshYandexTokens();
      toast({ title: "Токены обновлены", duration: 3000 });
      await loadTokens();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Ошибка при обновлении токенов";
      setError(message);
    } finally {
      setTokenAction(null);
    }
  }, [loadTokens, toast]);

  const handleDeleteTokens = useCallback(async () => {
    if (confirmDelete && !window.confirm("Вы уверены, что хотите удалить токены?")) {
      return;
    }

    setTokenAction("delete");
    setError(null);
    try {
      await deleteYandexTokens();
      toast({ title: "Токены удалены", duration: 3000 });
      setTokensMeta(null);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Ошибка при удалении токенов";
      setError(message);
    } finally {
      setTokenAction(null);
    }
  }, [confirmDelete, toast]);

  return {
    tokensMeta,
    isLoading,
    error,
    tokenAction,
    loadTokens,
    handleRefreshTokens,
    handleDeleteTokens,
  };
}

export type UseYandexSmartHomeTokensResult = ReturnType<typeof useYandexSmartHomeTokens>;
