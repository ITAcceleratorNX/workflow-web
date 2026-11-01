import { cn } from "@/lib/utils";

type StepProgressProps = {
  /** All steps, e.g. the questions of a survey. */
  total: number;
  /** Steps reached, the current one included: «Вопрос 2 из 5» fills two. */
  current: number;
  /** What the bar says to screen readers, e.g. «Вопрос 2 из 5». */
  label: string;
  className?: string;
};

/** Progress through steps as segments (Figma «Вопрос 2 из 5»): the reached ones in the accent color. */
export function StepProgress({ total, current, label, className }: StepProgressProps) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-valuetext={label}
      className={cn("flex gap-1.5", className)}
    >
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={cn("h-1.5 flex-1 rounded-full", index < current ? "bg-ui-accent" : "bg-ui-raised")} />
      ))}
    </div>
  );
}
