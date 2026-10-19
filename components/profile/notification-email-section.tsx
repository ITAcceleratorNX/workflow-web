"use client";

import { useId, type FormEvent } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NOTIFICATION_EMAIL_MAX_LENGTH, useNotificationEmail } from "@/hooks/use-notification-email";
import { cn } from "@/lib/utils";

type NotificationEmailSectionVariant = "desktop" | "mobile";

/** Совпадает с соседними карточками вкладки «Уведомления» на десктопе и в мобильных настройках. */
const VARIANT_STYLES: Record<
  NotificationEmailSectionVariant,
  { card: string; title: string; input: string; hint: string; button: string; error: string }
> = {
  desktop: {
    card: "max-w-xl p-6 rounded-xl bg-[#2C2C2E]/50 border border-white/10 space-y-4",
    title: "text-base font-semibold text-white border-b border-white/10 pb-2",
    input:
      "text-sm bg-[#2C2C2E] border border-white/10 text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-[#E85D2B]/50 focus-visible:border-[#E85D2B] rounded-lg px-3 py-2.5",
    hint: "text-xs text-white/50",
    button: "bg-[#E85D2B] hover:bg-[#E85D2B]/90 text-white",
    error: "text-sm text-[#E85D2B]",
  },
  mobile: {
    card: "rounded-xl border border-border p-5 space-y-4",
    title: "text-lg font-semibold text-foreground",
    input:
      "h-12 rounded-lg border border-border bg-transparent px-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-border",
    hint: "text-[13px] text-muted-foreground",
    button: "w-full h-12 rounded-lg bg-[#F35713]",
    error: "text-sm text-[#F35713]",
  },
};

/** Администратор: адрес для писем о новых сервисных заявках. */
export function NotificationEmailSection({ variant }: { variant: NotificationEmailSectionVariant }) {
  const { value, setValue, error, isSaving, hasChanges, save } = useNotificationEmail();
  const styles = VARIANT_STYLES[variant];
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void save();
  };

  return (
    // noValidate: формат проверяет хук и показывает ошибку под полем, а не всплывашкой браузера.
    <form noValidate onSubmit={handleSubmit} className={styles.card}>
      <h2>
        <Label htmlFor={inputId} className={cn("block", styles.title)}>
          Email для уведомлений
        </Label>
      </h2>
      <div className="space-y-2">
        <Input
          id={inputId}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="admin@company.kz"
          maxLength={NOTIFICATION_EMAIL_MAX_LENGTH}
          readOnly={isSaving}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          className={styles.input}
        />
        <p id={hintId} className={styles.hint}>
          Сюда придут письма о новых сервисных заявках. Оставьте поле пустым, чтобы не получать письма.
        </p>
        {error && (
          <p id={errorId} role="alert" className={styles.error}>
            {error}
          </p>
        )}
      </div>
      <Button type="submit" disabled={isSaving || !hasChanges} className={styles.button}>
        {isSaving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        {isSaving ? "Сохранение..." : "Сохранить"}
      </Button>
    </form>
  );
}
