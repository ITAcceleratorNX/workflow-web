"use client";

import { useEffect } from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useIsDesktop } from "@/hooks/use-media-query";

/**
 * Applies `html.dark` for mobile viewport only — drives `bg-background` and shadcn tokens.
 * Desktop layout keeps its own hardcoded styles without mobile theme class.
 */
export function MobileThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    const root = document.documentElement;
    if (isDesktop) {
      root.classList.remove("dark");
      return;
    }
    root.classList.toggle("dark", scheme === "dark");
  }, [scheme, isDesktop]);

  return <>{children}</>;
}
