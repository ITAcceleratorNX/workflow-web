import { dateKey, formatRangeLabel, managerPeriodStart } from "@/lib/manager-period";

/**
 * «Экспорт в Excel» раздела «Заявки» Руководителя: параметры запроса к GET /request-groups/export,
 * сводка условий для окна перед скачиванием и имя файла. Условия — текущие вкладка и фильтры списка.
 */

export type RequestListPeriod = "all" | "week" | "month" | "year";

export interface RequestExportConditions {
  tab: "all" | "rejected";
  /** "all" или id офиса. */
  office: string;
  officeName?: string | null;
  period: RequestListPeriod;
  status: string;
  statusLabel?: string | null;
  type: string;
  typeLabel?: string | null;
}

export interface RequestPeriodRange {
  from: Date;
  to: Date;
}

/** Границы периода — по тому же правилу, что у фильтра списка, до текущего момента. */
export function requestPeriodRange(period: RequestListPeriod, now = new Date()): RequestPeriodRange | null {
  return period === "all" ? null : { from: managerPeriodStart(period, now), to: now };
}

/** На вкладке «Отклонённые» статус задан самой вкладкой. */
function statusApplies(conditions: RequestExportConditions): boolean {
  return conditions.tab !== "rejected" && conditions.status !== "all";
}

export function requestExportParams(
  conditions: RequestExportConditions,
  range: RequestPeriodRange | null,
): Record<string, string> {
  const params: Record<string, string> = {};
  if (conditions.tab === "rejected") params.tab = "rejected";
  if (conditions.office !== "all") params.office_id = conditions.office;
  if (range) {
    params.from = range.from.toISOString();
    params.to = range.to.toISOString();
  }
  if (statusApplies(conditions)) params.status = conditions.status;
  if (conditions.type !== "all") params.priority = conditions.type;
  return params;
}

/** «Teniz Towers · 30 сентября – 30 октября 2026 · Исполнение · все типы». */
export function requestExportSummary(conditions: RequestExportConditions, range: RequestPeriodRange | null): string {
  const parts = [
    conditions.office === "all" ? "Все офисы" : conditions.officeName || `Офис №${conditions.office}`,
    range ? formatRangeLabel(dateKey(range.from), dateKey(range.to)) : "весь период",
  ];
  if (conditions.tab !== "rejected") {
    parts.push(statusApplies(conditions) ? conditions.statusLabel || conditions.status : "все статусы");
  }
  parts.push(conditions.type === "all" ? "все типы" : conditions.typeLabel || conditions.type);
  return parts.join(" · ");
}

/** «1 заявка», «3 заявки», «12 заявок». */
export function formatRequestCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word = mod10 === 1 && mod100 !== 11
    ? "заявка"
    : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? "заявки" : "заявок";
  return `${count} ${word}`;
}

/** «3 заявки · вкладка «Все»». */
export function requestExportMeta(count: number, tab: RequestExportConditions["tab"]): string {
  return `${formatRequestCount(count)} · вкладка «${tab === "rejected" ? "Отклонённые" : "Все"}»`;
}

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k",
  л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  ә: "a", ғ: "g", қ: "k", ң: "n", ө: "o", ұ: "u", ү: "u", һ: "h", і: "i",
};

/** «Нурлы-Тау» → «nurly-tau»: латиница без пробелов, чтобы имя файла читалось везде. */
export function fileNameSlug(text: string): string {
  return [...text.toLowerCase()]
    .map((char) => TRANSLIT[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function shortDate(date: Date, withYear: boolean): string {
  const [y, m, d] = dateKey(date).split("-");
  return withYear ? `${d}.${m}.${y}` : `${d}.${m}`;
}

/** «zayavki_teniz-towers_30.09–30.10.2026.xlsx»; без периода — с датой выгрузки. */
export function requestExportFileName(
  conditions: RequestExportConditions,
  range: RequestPeriodRange | null,
  now = new Date(),
): string {
  const parts = ["zayavki"];
  if (conditions.tab === "rejected") parts.push("otklonennye");
  const office = conditions.office !== "all" && conditions.officeName ? fileNameSlug(conditions.officeName) : "";
  if (office) parts.push(office);
  if (range) {
    const sameYear = range.from.getFullYear() === range.to.getFullYear();
    parts.push(`${shortDate(range.from, !sameYear)}–${shortDate(range.to, true)}`);
  } else {
    parts.push(shortDate(now, true));
  }
  return `${parts.join("_")}.xlsx`;
}
