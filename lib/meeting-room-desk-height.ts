export const DESK_HEIGHT_OPTIONS = [150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200];

function weightAdjustment(weight: number): number {
  if (weight <= 64) return -2;
  if (weight <= 69) return -1;
  if (weight <= 79) return 0;
  if (weight <= 89) return 1;
  return 2;
}

/** Расчёт высоты стола: сидя и стоя (с опциональной коррекцией по весу). */
export function calculateDeskHeights(
  height: number,
  weight?: number,
): { sitting: number; standing: number } | null {
  if (Number.isNaN(height) || height < 100 || height > 250) return null;

  const sitting = Math.round(height * 0.29 + 20);
  let standing = Math.round(height * 0.62 - 2);

  if (weight !== undefined && !Number.isNaN(weight) && weight > 0) {
    standing += weightAdjustment(weight);
  }

  return { sitting, standing };
}
