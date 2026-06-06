import type { SleepRating } from "@/stores/sleep-store";

export function sleepRatingLabel(rating: SleepRating | null): string {
  if (rating === "good") return "Хороший сон";
  if (rating === "ok") return "Можно и лучше";
  if (rating === "poor") return "Не выспался";
  return "Оцените сон";
}

export function formatLiters(ml: number): string {
  if (ml >= 1000) return `${(ml / 1000).toFixed(1)} л`;
  return `${ml} мл`;
}
