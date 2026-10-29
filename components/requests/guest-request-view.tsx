"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { AlertCircle, Eye, Loader2, LogIn } from "lucide-react";
import PhotoModal from "@/components/photo/PhotoModal";
import { getGuestRequest, type GuestRequestView } from "@/lib/api";
import {
  formatServiceCategoryDisplayName,
  getStatusLabel,
  getTypeLabel,
} from "@/constants/requests";
import { getRoleLabel } from "@/constants/roles";
import { formatDateTime } from "@/lib/dateTimeUtils";
import {
  isPhoneUserAgent,
  mobileAppRequestUrl,
  requestLoginPath,
} from "@/lib/request-share-link";
import { useIsDesktop } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { RequestDetailPhotoGrid } from "./request-detail-photo-grid";

// Ключ MobileDeepLinkToApp: приложение уже пробовали открыть, на `/?requestId=` не повторять.
const DEEP_LINK_TRIED_KEY = "workflowmobile_deeplink_triggered";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; request: GuestRequestView }
  | { kind: "unavailable" }
  | { kind: "failed" };

function DetailBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="text-foreground text-base leading-snug">{children}</div>
    </div>
  );
}

function formatCreatedDate(date: string): string {
  return new Date(date).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPlannedDate(date: string): string {
  return new Date(date).toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * «Войти в Workflow»: на компьютере — вход в веб-версию; на телефоне — приложение. Сами на вход
 * в веб-версию не уходим: iOS сначала спрашивает «Открыть в Workflow?», и пока вопрос на экране,
 * страница видна — по таймеру не отличить «приложения нет» от «человек ещё не ответил».
 * Поэтому после попытки под кнопкой появляется ссылка на вход в веб-версию.
 */
function useOpenInWorkflow(requestId: number | null) {
  const router = useRouter();
  const [appTried, setAppTried] = useState(false);

  const openWeb = useCallback(() => {
    if (requestId == null) return;
    try {
      sessionStorage.setItem(DEEP_LINK_TRIED_KEY, "1");
    } catch {
      // Без sessionStorage приложение просто попробуют открыть ещё раз.
    }
    router.push(requestLoginPath(requestId));
  }, [requestId, router]);

  const open = useCallback(() => {
    if (requestId == null) return;
    if (!isPhoneUserAgent(navigator.userAgent)) {
      router.push(requestLoginPath(requestId));
      return;
    }
    setAppTried(true);
    window.location.href = mobileAppRequestUrl(requestId);
  }, [requestId, router]);

  return { open, openWeb, appTried };
}

/**
 * Гостевой просмотр заявки по ссылке «Поделиться»: повторяет карточку заявки
 * (RequestDetailMobileBody) в режиме «только просмотр», без меню действий и ввода комментариев.
 */
export function GuestRequestPage({ token }: { token: string }) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; created_at?: string } | null>(null);
  const isSignedIn = useAuthStore((s) => !!s.token && !!s.role);
  // Тему `dark` ColorSchemeInitScript ставит только на телефоне; desktop-экраны веба всегда тёмные.
  const isDesktop = useIsDesktop();
  const barBg = isDesktop ? "bg-desktop-bg/95" : "bg-background/95";

  const load = useCallback(() => {
    setState({ kind: "loading" });
    getGuestRequest(token)
      .then(({ data }) => setState({ kind: "ready", request: data }))
      .catch((error) => {
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        setState(status === 404 ? { kind: "unavailable" } : { kind: "failed" });
      });
  }, [token]);

  useEffect(load, [load]);

  const request = state.kind === "ready" ? state.request : null;
  const openInWorkflow = useOpenInWorkflow(request?.id ?? null);

  return (
    <div className={cn("min-h-dvh bg-background text-foreground", isDesktop && "dark bg-desktop-bg")}>
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
        <header className={cn("sticky top-0 z-10 flex items-center gap-3 border-b border-border px-4 py-3 backdrop-blur", barBg)}>
          {/* Логотип чёрный — на белой плашке, как на экране загрузки (FullScreenLoading). */}
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/app-icon.png" alt="Workflow" className="h-full w-full object-contain" />
          </span>
          <h1 className="flex-1 truncate text-xl font-bold">
            {request ? `Заявка #${request.id}` : "Workflow"}
          </h1>
        </header>

        <main className="flex-1 p-4 pb-40">
          {state.kind === "loading" ? (
            <div className="flex justify-center py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" aria-label="Загрузка" />
            </div>
          ) : null}

          {state.kind === "unavailable" || state.kind === "failed" ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
              <p className="text-lg font-semibold">
                {state.kind === "unavailable" ? "Заявка недоступна" : "Не удалось загрузить заявку"}
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {state.kind === "unavailable"
                  ? "Ссылка недействительна или заявка была удалена. Попросите отправить ссылку ещё раз."
                  : "Проверьте подключение к интернету и попробуйте ещё раз."}
              </p>
              {state.kind === "failed" ? (
                <button
                  type="button"
                  onClick={load}
                  className="mt-2 rounded-xl bg-muted px-5 py-2.5 text-sm font-medium hover:bg-muted/80"
                >
                  Повторить
                </button>
              ) : null}
            </div>
          ) : null}

          {request ? <GuestRequestBody request={request} onPhotoClick={setSelectedPhoto} /> : null}
        </main>

        {request ? (
          <div
            className={cn("fixed inset-x-0 bottom-0 border-t border-border backdrop-blur", barBg)}
            style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)" }}
          >
            <div className="mx-auto w-full max-w-2xl px-4 pt-3">
              <button
                type="button"
                onClick={openInWorkflow.open}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F35713] px-4 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#F35713]/90"
              >
                <LogIn className="h-5 w-5" />
                {isSignedIn ? "Открыть в Workflow" : "Войти в Workflow"}
              </button>
              {openInWorkflow.appTried ? (
                <button
                  type="button"
                  onClick={openInWorkflow.openWeb}
                  className="mt-2 w-full py-1.5 text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  Приложение не открылось? Войти в веб-версии
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {selectedPhoto ? <PhotoModal selectedPhoto={selectedPhoto} onClose={() => setSelectedPhoto(null)} /> : null}
    </div>
  );
}

function GuestRequestBody({
  request,
  onPhotoClick,
}: {
  request: GuestRequestView;
  onPhotoClick: (photo: { url: string; created_at?: string }) => void;
}) {
  const photos = [
    ...request.photos.filter((p) => p.type === "before"),
    ...request.photos.filter((p) => p.type === "after"),
  ];
  const office = request.office
    ? [request.office.name, request.office.address].filter(Boolean).join(", ")
    : "";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-lg bg-[#F35713] px-2.5 py-1 text-xs font-semibold text-white">
          {getStatusLabel(request.status)}
        </span>
        <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
          {getTypeLabel(request.request_type ?? "normal")}
        </span>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3">
        <Eye className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Просмотр по ссылке: заявку можно посмотреть, но не изменить. Чтобы работать с ней,
          войдите в Workflow.
        </p>
      </div>

      {request.request_type === "planned" && request.planned_date ? (
        <DetailBlock label="Запланировано на">{formatPlannedDate(request.planned_date)}</DetailBlock>
      ) : null}

      {request.requests.map((sr) => (
        <div key={sr.id} className="space-y-4">
          <DetailBlock label={`Заявка #${sr.id}`}>
            <p className="font-medium">{sr.title || formatServiceCategoryDisplayName(sr.category?.name)}</p>
            {sr.category?.name && sr.title ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {formatServiceCategoryDisplayName(sr.category.name)}
              </p>
            ) : null}
          </DetailBlock>
          {sr.description ? (
            <DetailBlock label="Описание">
              <p className="whitespace-pre-wrap break-words">{sr.description}</p>
            </DetailBlock>
          ) : null}
        </div>
      ))}

      {request.location_detail ? (
        <DetailBlock label="Локация в офисе">{request.location_detail}</DetailBlock>
      ) : null}

      <DetailBlock label="Офис">{office || "—"}</DetailBlock>

      <DetailBlock label="Дата создания">{formatCreatedDate(request.created_date)}</DetailBlock>

      {photos.length > 0 ? (
        <RequestDetailPhotoGrid
          photos={photos}
          onPhotoClick={onPhotoClick}
        />
      ) : null}

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Комментарии</p>
        {request.comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Комментариев пока нет</p>
        ) : (
          <ul className="space-y-2">
            {request.comments.map((c) => (
              <li key={c.id} className="rounded-xl bg-muted/50 p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <p className="text-sm font-semibold">
                    {c.author?.full_name ?? "Пользователь"}
                    {c.author?.role ? (
                      <span className="ml-2 font-normal text-muted-foreground">{getRoleLabel(c.author.role)}</span>
                    ) : null}
                  </p>
                  <time className="text-xs text-muted-foreground" dateTime={c.timestamp}>
                    {formatDateTime(c.timestamp)}
                  </time>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm">{c.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
