"use client";

import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { fetchNotificationEmail, updateNotificationEmail } from "@/lib/profile-api";
import { getZodErrorMessage } from "@/lib/registration-schema";
import { useAuthStore } from "@/stores/useAuthStore";

export const NOTIFICATION_EMAIL_MAX_LENGTH = 255;

/** Те же правила, что у бэкенда (UpdateNotificationEmailDto), чтобы ошибку видно было без запроса. */
const notificationEmailSchema = z
  .string()
  .max(NOTIFICATION_EMAIL_MAX_LENGTH, `Email не длиннее ${NOTIFICATION_EMAIL_MAX_LENGTH} символов`)
  .email("Некорректный email");

/**
 * «Email для уведомлений» администратора: сюда бэкенд шлёт письма о новых сервисных заявках.
 * Пустое поле — письма не отправляются.
 */
export function useNotificationEmail() {
  const savedEmail = useAuthStore((s) => s.user?.notification_email ?? null);
  const updateUser = useAuthStore((s) => s.updateUser);
  const { toast } = useToast();

  /** null — поле не трогали: показываем сохранённый адрес, и он обновится, когда придёт с сервера. */
  const [draft, setDraft] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const value = draft ?? savedEmail ?? "";
  const hasChanges = value.trim() !== (savedEmail ?? "");

  // Persisted store мог устареть: адрес могли поменять с телефона.
  useEffect(() => {
    let cancelled = false;
    fetchNotificationEmail().then((email) => {
      if (!cancelled && email !== undefined) updateUser({ notification_email: email });
    });
    return () => {
      cancelled = true;
    };
  }, [updateUser]);

  const setValue = useCallback((next: string) => {
    setDraft(next);
    setError("");
  }, []);

  const save = useCallback(async () => {
    if (isSaving || !hasChanges) return;

    const email = value.trim() || null;
    if (email) {
      const parsed = notificationEmailSchema.safeParse(email);
      if (!parsed.success) {
        setError(getZodErrorMessage(parsed.error));
        return;
      }
    }

    setIsSaving(true);
    setError("");
    const result = await updateNotificationEmail(email);
    setIsSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    updateUser({ notification_email: result.notificationEmail });
    setDraft(null);
    toast({
      title: "Успешно",
      description: result.notificationEmail
        ? "Email для уведомлений сохранён"
        : "Email для уведомлений удалён",
    });
  }, [hasChanges, isSaving, toast, updateUser, value]);

  return { value, setValue, error, isSaving, hasChanges, save };
}
