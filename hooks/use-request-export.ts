"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { validateAnalyticsDownload } from "@/lib/analytics-download-validation";
import { saveBlobAsFile } from "@/lib/file-download";

export type RequestExportState =
  | { status: "idle" }
  | { status: "preparing" }
  /** count — сколько заявок записал сервер (заголовок X-Export-Count). */
  | { status: "success"; fileName: string; count: number | null }
  | { status: "error"; message: string };

interface ExportJob {
  params: Record<string, string>;
  fileName: string;
}

/** «Файл готов» висит несколько секунд; ошибка — пока её не закроют или не повторят. */
const SUCCESS_NOTICE_MS = 6000;

function exportErrorMessage(failure: unknown): string {
  const status = (failure as { response?: { status?: number } })?.response?.status;
  if (status === 401) return "Сессия истекла. Войдите в аккаунт снова.";
  if (status === 403) return "Нет доступа к выгрузке заявок.";
  return "Проверьте соединение и попробуйте ещё раз. Фильтры сохранены.";
}

/**
 * Скачивание заявок в .xlsx с сервера (GET /request-groups/export): подготовка, успех с числом
 * заявок в файле, ошибка с «Повторить» — по тем же условиям, фильтры списка не трогаются.
 */
export function useRequestExport() {
  const [state, setState] = useState<RequestExportState>({ status: "idle" });
  const lastJob = useRef<ExportJob | null>(null);
  const running = useRef(false);

  const run = useCallback(async (job: ExportJob) => {
    if (running.current) return;
    running.current = true;
    lastJob.current = job;
    setState({ status: "preparing" });
    try {
      const response = await api.get<Blob>("/request-groups/export", { params: job.params, responseType: "blob" });
      const blob = response.data;
      const contentType = (response.headers["content-type"] || blob.type || "").toLowerCase();
      validateAnalyticsDownload(response.status, blob.size, contentType);
      await saveBlobAsFile(blob, job.fileName, contentType);
      const count = Number(response.headers["x-export-count"]);
      setState({ status: "success", fileName: job.fileName, count: Number.isFinite(count) ? count : null });
    } catch (failure) {
      setState({ status: "error", message: exportErrorMessage(failure) });
    } finally {
      running.current = false;
    }
  }, []);

  const retry = useCallback(() => {
    if (lastJob.current) void run(lastJob.current);
  }, [run]);

  const dismiss = useCallback(() => setState({ status: "idle" }), []);

  useEffect(() => {
    if (state.status !== "success") return;
    const timer = setTimeout(dismiss, SUCCESS_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [state, dismiss]);

  return {
    state,
    download: (params: Record<string, string>, fileName: string) => void run({ params, fileName }),
    retry,
    dismiss,
  };
}
