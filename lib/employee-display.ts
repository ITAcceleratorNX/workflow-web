/**
 * Сотрудник в местах выбора: ФИО — основная строка, компания, отдел и должность — вторичная.
 * Пустая должность не выводится вовсе, без «Не указано». На права она не влияет.
 */

/** Регистр не важен, «ё» читается как «е» — так же ищет сервер. */
export function foldSearchText(value: string | null | undefined): string {
  return (value ?? "").toLocaleLowerCase("ru").replace(/ё/g, "е").trim();
}

/** Каждое слово запроса встречается хотя бы в одном из полей (ФИО, должность…); пустой запрос подходит всем. */
export function matchesEveryWord(query: string, fields: (string | null | undefined)[]): boolean {
  const words = foldSearchText(query).split(/\s+/).filter(Boolean);
  const texts = fields.map(foldSearchText);
  return words.every((word) => texts.some((text) => text.includes(word)));
}

/** Вторичная строка: «Компания · Отдел · Должность» без пустых частей; null — выводить нечего. */
export function employeeSubtitle(parts: (string | null | undefined)[]): string | null {
  const text = parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" · ");
  return text || null;
}
