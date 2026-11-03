import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  /** An action under the text, e.g. an outlined «Открыть входящие» button. */
  action?: ReactNode;
  /**
   * A tile behind the icon: `neutral` — a rounded square on the surface («Сейчас нет доступных
   * опросов»); `success` / `danger` — a tinted circle of a result («Ответы отправлены», «Не удалось
   * отправить ответы»). Without it the icon stands alone.
   */
  tile?: "neutral" | "success" | "danger";
  /** `lg` — the large title of a result screen. */
  size?: "md" | "lg";
  className?: string;
};

const TILE_CLASSES = {
  neutral: "size-16 rounded-4pt-xl bg-ui-surface text-ui-fg/45 [&_svg]:size-[30px]",
  success: "size-[88px] rounded-full bg-ui-success-soft text-ui-success [&_svg]:size-11",
  danger: "size-[88px] rounded-full bg-ui-danger-soft text-ui-danger [&_svg]:size-10",
} as const;

/** Empty list, placeholder panel or result (Figma «На сегодня задач нет», «Выберите задачу», «Ответы отправлены»). */
export function EmptyState({ icon, title, description, action, tile, size = "md", className }: EmptyStateProps) {
  const large = size === "lg";
  return (
    <div className={cn("flex flex-col items-center px-4 text-center", large ? "gap-3.5" : "gap-2.5", className)}>
      <span
        aria-hidden
        className={cn(
          "mb-0.5 flex shrink-0 items-center justify-center",
          tile ? TILE_CLASSES[tile] : "size-12 text-ui-fg/30 [&_svg]:size-11",
        )}
      >
        {icon}
      </span>
      <p className={cn("text-ui-fg", large ? "mt-1.5 text-[26px] font-bold leading-[31px]" : "text-lg font-semibold")}>{title}</p>
      {description ? (
        <p className={cn("max-w-sm whitespace-pre-line text-ui-fg/55", large ? "text-[15px] leading-[22px]" : "text-sm")}>{description}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
