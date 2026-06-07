/** "HH:mm" or "HH:mm:ss" -> "HH:mm:ss" */
export function toHHmmss(v: string): string {
  const s = (v || "").trim();
  if (!s) return "";
  const parts = s.split(":");
  if (parts.length >= 3) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:${parts[2].padStart(2, "0")}`;
  }
  if (parts.length === 2) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:00`;
  }
  if (parts.length === 1 && /^\d{1,2}$/.test(parts[0])) {
    return `${parts[0].padStart(2, "0")}:00:00`;
  }
  return s;
}

/** "HH:mm:ss" -> "HH:mm" for display */
export function toHHmm(v: string | null | undefined): string {
  if (!v || typeof v !== "string") return "";
  const parts = v.trim().split(":");
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return v;
}

/** Этаж из поля ввода: пусто → null, иначе целое ≥ 0 */
export function parseFloorField(s: string): { ok: true; value: number | null } | { ok: false } {
  const t = s.trim();
  if (t === "") return { ok: true, value: null };
  const n = parseInt(t, 10);
  if (Number.isNaN(n) || n < 0) return { ok: false };
  return { ok: true, value: n };
}
