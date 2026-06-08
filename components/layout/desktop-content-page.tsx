"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DesktopContentPageProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Desktop pages use dark shell (#1A1A1A) — default true */
  dark?: boolean;
};

/** Standard page header + content inside desktop shell. */
export function DesktopContentPage({
  title,
  description,
  actions,
  children,
  className,
  dark = true,
}: DesktopContentPageProps) {
  return (
    <div
      className={cn(
        "client-desktop-content p-6 lg:p-8 max-w-6xl mx-auto w-full",
        dark && "client-desktop-dark",
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className={cn("text-2xl font-bold", dark ? "text-white" : "text-foreground")}>
            {title}
          </h1>
          {description ? (
            <p className={cn("text-sm mt-1", dark ? "text-white/60" : "text-muted-foreground")}>
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
