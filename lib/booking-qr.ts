/** Парсинг booking ID из QR payload — parity с workflow-mobile/app/executor/scan-qr.tsx */

export function normalizeBookingId(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = parseInt(value.trim(), 10);
    if (!Number.isNaN(n) && Number.isInteger(n)) return n;
  }
  return undefined;
}

/** Извлекает ID бронирования из JSON, URL или строки цифр. */
export function parseBookingIdFromQrPayload(trimmed: string): number | undefined {
  if (!trimmed) return undefined;

  try {
    const parsed = JSON.parse(trimmed) as { bookingId?: unknown; booking_id?: unknown; id?: unknown };
    const id = normalizeBookingId(parsed?.bookingId ?? parsed?.booking_id ?? parsed?.id);
    if (id !== undefined) return id;
  } catch {
    // not JSON
  }

  const slashMatch = trimmed.match(/\/booking\/(\d+)/i) ?? trimmed.match(/booking\/(\d+)/i);
  if (slashMatch) {
    const id = parseInt(slashMatch[1], 10);
    if (Number.isInteger(id)) return id;
  }

  const qpMatch = /(?:^|[?&#])(?:bookingId|booking_id|id)=(\d+)/i.exec(trimmed);
  if (qpMatch) {
    const id = parseInt(qpMatch[1], 10);
    if (Number.isInteger(id)) return id;
  }

  if (/^-?\d+$/.test(trimmed)) {
    const id = parseInt(trimmed, 10);
    if (Number.isInteger(id)) return id;
  }

  return undefined;
}
