export function validateAnalyticsDownload(status: number, size: number, contentType: string): void {
  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream",
    "application/zip",
  ];
  const mime = contentType.toLowerCase().split(";")[0].trim();
  if (status < 200 || status >= 300 || size <= 0 || !allowedTypes.includes(mime)) {
    throw new Error("Сервер не вернул файл экспорта. Попробуйте ещё раз");
  }
}
