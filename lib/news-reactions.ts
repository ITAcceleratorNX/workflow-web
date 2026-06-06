export const NEWS_REACTION_OPTIONS = [
  { kind: "thumb" as const, icon: "thumb" as const },
  { kind: "heart" as const, icon: "heart" as const },
  { kind: "eyes" as const, icon: "eyes" as const },
  { kind: "fire" as const, icon: "fire" as const },
] as const;

export type NewsReactionKind = (typeof NEWS_REACTION_OPTIONS)[number]["kind"];

export type NewsReactionCounts = Record<NewsReactionKind, number>;

export function emptyReactionCounts(): NewsReactionCounts {
  return { thumb: 0, heart: 0, eyes: 0, fire: 0 };
}

export function normalizeReactionCounts(
  raw: Partial<NewsReactionCounts> | null | undefined,
): NewsReactionCounts {
  const base = emptyReactionCounts();
  if (!raw || typeof raw !== "object") return base;
  for (const k of Object.keys(base) as NewsReactionKind[]) {
    const n = Number((raw as Record<string, unknown>)[k]);
    base[k] = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  }
  return base;
}
