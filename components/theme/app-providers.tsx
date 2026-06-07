"use client";

import { MobileThemeProvider } from "@/components/theme/mobile-theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <MobileThemeProvider>{children}</MobileThemeProvider>;
}
