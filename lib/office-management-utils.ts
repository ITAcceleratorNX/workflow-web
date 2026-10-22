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

/** Широта и долгота офиса, как они набраны в форме. */
export type OfficeCoordinatesInput = { lat: string; lon: string };

const COORDINATE_LIMITS = { lat: { label: "Широта", max: 90 }, lon: { label: "Долгота", max: 180 } } as const;

/** Поля формы из офиса: API отдаёт NUMERIC строкой или числом, пусто — координат нет. */
export function officeCoordinatesInput(office: { lat?: number | string | null; lon?: number | string | null }): OfficeCoordinatesInput {
  return { lat: office.lat == null ? "" : String(office.lat), lon: office.lon == null ? "" : String(office.lon) };
}

export function hasOfficeCoordinates(office: { lat?: number | string | null; lon?: number | string | null }): boolean {
  return office.lat != null && office.lon != null && office.lat !== "" && office.lon !== "";
}

function parseCoordinate(field: keyof OfficeCoordinatesInput, text: string): { ok: true; value: number | null } | { ok: false; error: string } {
  const t = text.trim().replace(",", ".");
  if (t === "") return { ok: true, value: null };
  const { label, max } = COORDINATE_LIMITS[field];
  const n = Number(t);
  if (!Number.isFinite(n) || Math.abs(n) > max) return { ok: false, error: `${label} — число от −${max} до ${max}` };
  return { ok: true, value: n };
}

/**
 * Координаты из формы офиса — только парой, как их хранит бэкенд. Обе пустые — координат нет,
 * и офис не участвует в «Определить ближайший офис».
 */
export function parseOfficeCoordinates(
  input: OfficeCoordinatesInput,
): { ok: true; lat: number | null; lon: number | null } | { ok: false; error: string } {
  const lat = parseCoordinate("lat", input.lat);
  if (!lat.ok) return lat;
  const lon = parseCoordinate("lon", input.lon);
  if (!lon.ok) return lon;
  if ((lat.value === null) !== (lon.value === null)) {
    return { ok: false, error: "Укажите широту и долготу вместе или очистите обе" };
  }
  return { ok: true, lat: lat.value, lon: lon.value };
}

/**
 * «43.214868, 76.872067» — так точку копируют Google Maps и 2ГИС: широта и долгота одной строкой.
 * Оба числа с точкой: «43,2» в одном поле — это десятичная запятая, а не пара.
 */
export function splitCoordinatesPair(text: string): OfficeCoordinatesInput | null {
  const m = /^\s*(-?\d{1,3}\.\d+)\s*[,;\s]\s*(-?\d{1,3}\.\d+)\s*$/.exec(text);
  return m ? { lat: m[1], lon: m[2] } : null;
}

/** Точка на карте — администратор проверяет, что координаты указывают на здание офиса. */
export function coordinatesMapUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}
