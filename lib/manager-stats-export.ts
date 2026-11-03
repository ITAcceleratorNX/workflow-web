import api from "@/lib/api";
import { validateAnalyticsDownload } from "@/lib/analytics-download-validation";
import { saveBlobAsFile } from "@/lib/file-download";
import { dateKey } from "@/lib/manager-period";

export async function exportManagerAnalytics(
  token: string | null,
  options: { office?: string; startDate?: Date; endDate?: Date; format: "xlsx" | "pbix" },
): Promise<void> {
  if (!token) throw new Error("Сессия истекла. Войдите в аккаунт снова");
  const params: Record<string, string> = { format: options.format };
  if (options.office && options.office !== "all") params.office_id = options.office;
  // Локальная дата: toISOString сдвинул бы полночь по Алматы на предыдущий день.
  if (options.startDate) params.from = dateKey(options.startDate);
  if (options.endDate) params.to = dateKey(options.endDate);
  const response = await api.get<Blob>("/analytics/export", { params, responseType: "blob" });
  const blob = response.data;
  const contentType = (response.headers["content-type"] || blob.type || "").toLowerCase();
  validateAnalyticsDownload(response.status, blob.size, contentType);
  const filename = options.format === "pbix" ? "analytics_template.pbix" : "analytics.xlsx";
  await saveBlobAsFile(blob, filename, contentType);
}
