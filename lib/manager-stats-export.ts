import "@/lib/android-bridge";

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

const EXPORT_BASE_URL = "https://workflow-back-zpk4.onrender.com/api/analytics/export";

export async function exportManagerAnalytics(
  token: string | null,
  options: {
    office?: string;
    startDate?: Date;
    endDate?: Date;
    format: "xlsx" | "pbix";
  },
): Promise<void> {
  if (!token) {
    alert("Не найден токен авторизации");
    return;
  }

  const params = new URLSearchParams();
  if (options.office && options.office !== "all") {
    params.append("office_id", String(options.office));
  }
  if (options.startDate) {
    params.append("from", options.startDate.toISOString().split("T")[0]);
  }
  if (options.endDate) {
    params.append("to", options.endDate.toISOString().split("T")[0]);
  }
  params.append("format", options.format);

  const url = `${EXPORT_BASE_URL}?${params.toString()}`;

  try {
    if (window.androidApp) {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = function () {
        const base64data = reader.result?.toString().split(",")[1] || "";
        const mimeType =
          blob.type ||
          (options.format === "xlsx"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "application/octet-stream");
        window.androidApp?.saveFileBase64(`analytics.${options.format}`, base64data, mimeType);
      };
      reader.readAsDataURL(blob);
    } else if (window.webkit?.messageHandlers?.saveFile) {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = function () {
        const base64data = reader.result?.toString().split(",")[1] || "";
        const mimeType =
          blob.type ||
          (options.format === "xlsx"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "application/octet-stream");
        window.webkit?.messageHandlers?.saveFile?.postMessage({
          filename: `analytics.${options.format}`,
          base64Data: base64data,
          mimeType,
        });
      };
      reader.readAsDataURL(blob);
    } else {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `analytics.${options.format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objectUrl);
    }
  } catch (error) {
    console.error("Ошибка при экспорте файла:", error);
    alert("Не удалось экспортировать файл");
  }
}
