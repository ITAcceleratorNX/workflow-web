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

/**
 * Сохраняет скачанный файл: в приложении (Android/iOS WebView) — через его мост, в браузере —
 * обычной загрузкой по ссылке.
 */
export async function saveBlobAsFile(blob: Blob, filename: string, contentType: string): Promise<void> {
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
