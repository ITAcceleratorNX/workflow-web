"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Copy, ExternalLink, Link2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import { confirmAction } from "@/stores/confirm-dialog-store";
import {
  disableCalendarSubscription,
  disconnectGoogleCalendar,
  enableCalendarSubscription,
  getGoogleCalendarAuthUrl,
  getTaskCalendarStatus,
  syncGoogleCalendar,
  type TaskCalendarStatus,
} from "@/lib/task-calendar-api";
import { lastSyncedLabel } from "@/lib/task-calendar";

type Busy = null | "connect" | "sync" | "disconnect" | "ics" | "rotate";

/**
 * Синхронизация задач с внешними календарями: Google Календарь и ссылка-подписка
 * (Apple Календарь, Outlook). Одностороннее направление: Workflow → календарь.
 * Общая для страницы /settings/calendar и вкладки «Настройки» десктопного профиля.
 */
export function TaskCalendarSettings() {
  const { toast } = useToast();
  const isGuest = useAuthStore((s) => s.isGuest);
  const [status, setStatus] = useState<TaskCalendarStatus | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);

  const load = useCallback(async () => {
    try {
      setStatus(await getTaskCalendarStatus());
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    if (!isGuest) void load();
  }, [isGuest, load]);


  const run = async (kind: Exclude<Busy, null>, work: () => Promise<void>, failure: string) => {
    setBusy(kind);
    try {
      await work();
    } catch {
      toast({ title: failure, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const connectGoogle = () =>
    run("connect", async () => {
      window.location.href = await getGoogleCalendarAuthUrl();
    }, "Не удалось начать подключение");

  const syncNow = () =>
    run("sync", async () => {
      const answer = await syncGoogleCalendar();
      await load();
      toast(answer.ok
        ? { title: "Календарь обновлён" }
        : { title: "Не удалось обновить календарь", description: answer.last_error ?? undefined, variant: "destructive" });
    }, "Не удалось обновить календарь");

  const disconnectGoogle = async () => {
    const ok = await confirmAction({
      title: "Отключить Google Календарь?",
      message: "Календарь «Workflow — задачи» будет удалён из вашего Google-аккаунта вместе с событиями. Задачи в Workflow не изменятся.",
      confirmLabel: "Отключить",
      destructive: true,
    });
    if (!ok) return;
    await run("disconnect", async () => {
      await disconnectGoogleCalendar();
      await load();
    }, "Не удалось отключить");
  };

  const toggleSubscription = (enabled: boolean) =>
    run("ics", async () => {
      if (enabled) await enableCalendarSubscription();
      else await disableCalendarSubscription();
      await load();
    }, enabled ? "Не удалось создать ссылку" : "Не удалось выключить ссылку");

  const rotateLink = async () => {
    const ok = await confirmAction({
      title: "Выпустить новую ссылку?",
      message: "Старая ссылка перестанет работать: календари, подписанные на неё, нужно будет подписать заново.",
      confirmLabel: "Выпустить",
    });
    if (!ok) return;
    await run("rotate", async () => {
      await enableCalendarSubscription(true);
      await load();
      toast({ title: "Новая ссылка готова" });
    }, "Не удалось выпустить ссылку");
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Ссылка скопирована" });
    } catch {
      toast({ title: "Не удалось скопировать", description: url, variant: "destructive" });
    }
  };

  const google = status?.google;
  const ics = status?.ics;
  const googleRevoked = google?.status === "revoked";
  const synced = lastSyncedLabel(google?.last_synced_at);
  return (
    <div className="space-y-4">
    <p className="text-[14px] text-muted-foreground">
      Задачи со сроком появятся в вашем календаре: задача только с датой — на весь день, со временем — в это время.
      Выполненные остаются с отметкой ✅. Изменения в календаре задачи в Workflow не меняют.
    </p>

    {isGuest ? (
      <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
        Подключение календаря недоступно в демо-версии.
      </p>
    ) : loadError ? (
      <div className="rounded-xl border border-border p-4 space-y-3">
        <p className="text-sm text-muted-foreground">Не удалось загрузить настройки календаря.</p>
        <Button variant="outline" onClick={() => void load()}>Повторить</Button>
      </div>
    ) : !status ? (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ) : (
      <>
        <section className="rounded-xl border border-border p-4 space-y-3" aria-labelledby="google-calendar-title">
          <div className="flex items-start gap-3">
            <CalendarDays className="h-[22px] w-[22px] text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h2 id="google-calendar-title" className="text-base font-medium">Google Календарь</h2>
              <p className="text-[13px] text-muted-foreground">
                Для Android, iPhone и компьютера. Обновляется сразу после изменения задачи.
              </p>
            </div>
          </div>

          {!google?.available ? (
            <p className="text-sm text-muted-foreground">Подключение Google Календаря пока не настроено.</p>
          ) : google.connected ? (
            <>
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <p className="font-medium truncate">{google.account_email ?? "Аккаунт Google"}</p>
                {google.status === "error" ? (
                  <p className="text-[13px] text-[#F35713]">{google.last_error ?? "Последняя синхронизация не удалась"}</p>
                ) : (
                  <p className="text-[13px] text-muted-foreground">{synced ?? "Первая синхронизация идёт…"}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => void syncNow()} disabled={busy !== null}>
                  {busy === "sync" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Обновить
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => void disconnectGoogle()} disabled={busy !== null}>
                  {busy === "disconnect" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Отключить"}
                </Button>
              </div>
            </>
          ) : (
            <>
              {googleRevoked && (
                <p className="text-[13px] text-[#F35713]">
                  {google.last_error ?? "Доступ к Google Календарю отозван. Подключите календарь заново."}
                </p>
              )}
              <Button className="w-full h-11 bg-[#F35713]" onClick={() => void connectGoogle()} disabled={busy !== null}>
                {busy === "connect" ? <Loader2 className="h-4 w-4 animate-spin" /> : googleRevoked ? "Подключить заново" : "Подключить Google Календарь"}
              </Button>
              <p className="text-[12px] text-muted-foreground">
                Workflow создаст отдельный календарь «Workflow — задачи» и не получит доступа к другим вашим календарям.
              </p>
            </>
          )}
        </section>

        <section className="rounded-xl border border-border p-4 space-y-3" aria-labelledby="calendar-link-title">
          <div className="flex items-start gap-3">
            <Link2 className="h-[22px] w-[22px] text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h2 id="calendar-link-title" className="text-base font-medium">Apple Календарь, Outlook и другие</h2>
              <p className="text-[13px] text-muted-foreground">
                Ссылка-подписка. Календарь обновляет её сам — от 15 минут до нескольких часов.
              </p>
            </div>
            <Switch
              checked={ics?.enabled ?? false}
              onCheckedChange={(checked) => void toggleSubscription(checked)}
              disabled={busy !== null}
              aria-label="Ссылка-подписка на календарь"
              className="data-[state=unchecked]:bg-[#212121] [&>span]:bg-white data-[state=checked]:bg-[#F35713]"
            />
          </div>

          {ics?.enabled && ics.feed_url && ics.webcal_url && (
            <>
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-[13px] break-all select-all">{ics.feed_url}</div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => void copyLink(ics.feed_url!)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Скопировать
                </Button>
                <Button variant="outline" asChild>
                  <a href={ics.webcal_url}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Открыть
                  </a>
                </Button>
              </div>
              <p className="text-[12px] text-muted-foreground">
                iPhone и Mac: «Открыть» добавит подписку в Календарь. Outlook: «Добавить календарь» → «Из интернета» и вставьте ссылку.
                Никому не передавайте ссылку — по ней видны ваши задачи.
              </p>
              <button
                type="button"
                onClick={() => void rotateLink()}
                disabled={busy !== null}
                className="text-[13px] text-primary disabled:opacity-50"
              >
                {busy === "rotate" ? "Выпускаем…" : "Выпустить новую ссылку"}
              </button>
            </>
          )}
        </section>
      </>
    )}
    </div>
  );
}
