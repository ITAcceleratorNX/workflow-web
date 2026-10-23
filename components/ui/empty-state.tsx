import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  /** An action under the text, e.g. an outlined «Открыть входящие» button. */
  action?: ReactNode;
  className?: string;
};

/** Empty list or placeholder panel (Figma «На сегодня задач нет», «Выберите задачу»). */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2.5 px-4 text-center", className)}>
      <span aria-hidden className="mb-0.5 flex size-12 items-center justify-center text-ui-fg/30 [&_svg]:size-11">
        {icon}
      </span>
      <p className="text-lg font-semibold text-ui-fg">{title}</p>
      {description ? (
        <p className="max-w-sm whitespace-pre-line text-sm text-ui-fg/55">{description}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
