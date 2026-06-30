/**
 * Публичная страница подтверждения брони в браузере (сканирование QR без приложения).
 * URL вида: `{origin}/confirm?id={bookingId}`.
 */
export function getBookingConfirmationWebUrl(bookingId: number): string {
  const explicit =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_URL
      ? String(process.env.NEXT_PUBLIC_APP_URL).replace(/\/$/, "")
      : "";
  const base =
    explicit ||
    (typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : "");
  return `${base}/confirm?id=${bookingId}`;
}
