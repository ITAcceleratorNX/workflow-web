import { cn } from "@/lib/utils";

const TONES = { accent: "bg-ui-accent", neutral: "bg-ui-fg/30" } as const;

type ShareBarProps = {
  /** Shares of 100, in order: one — over the track, several — side by side. */
  parts: readonly { percent: number; tone: keyof typeof TONES }[];
  /** `thick` — a bar of its own (Figma «Да / Нет»), otherwise under a row of the list. */
  thick?: boolean;
  className?: string;
};

/**
 * A share as a bar (Figma «Результаты»: options, ratings, «Да / Нет»). Only a picture: the numbers
 * are in the text beside it.
 */
export function ShareBar({ parts, thick = false, className }: ShareBarProps) {
  // One share fills its part of the track; several divide the bar between them, with a gap.
  const sizeOf = (percent: number) => (parts.length === 1 ? { width: `${Math.min(percent, 100)}%` } : { flex: `${percent} 1 0` });
  return (
    <div
      aria-hidden
      className={cn("flex w-full gap-0.5 overflow-hidden rounded-full bg-ui-fg/[0.06]", thick ? "h-[15px]" : "h-2", className)}
    >
      {parts.map((part, index) =>
        part.percent > 0 ? (
          <span key={index} style={sizeOf(part.percent)} className={cn("h-full rounded-full", TONES[part.tone])} />
        ) : null,
      )}
    </div>
  );
}
