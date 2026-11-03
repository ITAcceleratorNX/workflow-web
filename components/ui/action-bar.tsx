import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ActionBarProps = {
  children: ReactNode;
  /** `row` — side by side, equal widths («Назад / Далее»); `column` — one under another. */
  layout?: "row" | "column";
  className?: string;
};

/**
 * The actions at the bottom of a mobile screen (Figma «Начать», «Назад / Далее»): on the canvas
 * with a line on top, above the home indicator. Put it last in a full-height column: it sticks
 * to the bottom while the content scrolls.
 */
export function ActionBar({ children, layout = "row", className }: ActionBarProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 flex gap-2.5 border-t border-ui-fg/10 bg-ui-canvas px-4 pt-3",
        "pb-[max(1.875rem,env(safe-area-inset-bottom))]",
        layout === "row" ? "[&>*]:flex-1" : "flex-col",
        className,
      )}
    >
      {children}
    </div>
  );
}
