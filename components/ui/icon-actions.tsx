import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type IconAction = {
  /** What the action does, for screen readers and the tooltip: «Изменить». */
  label: string;
  icon: ReactNode;
  /** A screen to open; without it — `onClick` in place. */
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
};

const ACTION =
  "flex size-10 items-center justify-center rounded-full text-ui-fg transition-colors hover:bg-ui-fg/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[22px]";

/**
 * Round icon actions on one dark pill (Figma «Опросы»: «Изменить» and «Предпросмотр» of a draft).
 * Each action is a link or a button with its own label.
 */
export function IconActions({ actions, className }: { actions: readonly IconAction[]; className?: string }) {
  return (
    <div className={cn("inline-flex shrink-0 items-center rounded-full bg-ui-fg/[0.12]", className)}>
      {actions.map(({ label, icon, href, onClick, disabled }) =>
        href && !disabled ? (
          <Link key={label} href={href} aria-label={label} title={label} className={ACTION}>
            {icon}
          </Link>
        ) : (
          <button
            key={label}
            type="button"
            aria-label={label}
            title={label}
            onClick={onClick}
            disabled={disabled}
            className={ACTION}
          >
            {icon}
          </button>
        ),
      )}
    </div>
  );
}
