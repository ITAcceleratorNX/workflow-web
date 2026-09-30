import "@/lib/android-bridge";
import api from "@/lib/api";
import { validateAnalyticsDownload } from "@/lib/analytics-download-validation";

declare global {
  interface Window {
    webkit?: {
      messageHandlers: {
        saveFile: {
          postMessage: (message: {
            filename: string;
            base64Data: string;
            mimeType: string;
          }) => void;
        };
      };
    };
  }
}

export async function exportManagerAnalytics(
  token: string | null,
  options: { office?: string; startDate?: Date; endDate?: Date; format: "xlsx" | "pbix" },
): Promise<void> {
  if (!token) throw new Error("Сессия истекла. Войдите в аккаунт снова");
  const params: Record<string, string> = { format: options.format };
  if (options.office && options.office !== "all") params.office_id = options.office;
  if (options.startDate) params.from = options.startDate.toISOString().split("T")[0];
  if (options.endDate) params.to = options.endDate.toISOString().split("T")[0];
  const response = await api.get<Blob>("/analytics/export", { params, responseType: "blob" });
  const blob = response.data;
  const contentType = (response.headers["content-type"] || blob.type || "").toLowerCase();
  validateAnalyticsDownload(response.status, blob.size, contentType);
  const filename = options.format === "pbix" ? "analytics_template.pbix" : "analytics.xlsx";
  if (window.androidApp || window.webkit?.messageHandlers?.saveFile) {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Не удалось подготовить файл"));
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.readAsDataURL(blob);
    });
    if (window.androidApp) window.androidApp.saveFileBase64(filename, base64Data, contentType);
    else window.webkit?.messageHandlers?.saveFile.postMessage({ filename, base64Data, mimeType: contentType });
    return;
  }
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Keep the URL alive until the browser has consumed the download click.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
