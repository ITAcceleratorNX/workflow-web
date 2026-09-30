"use client";

import { MobileThemeProvider } from "@/components/theme/mobile-theme-provider";
import { AuthHydrationBoundary } from "@/components/auth-hydration-boundary";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <MobileThemeProvider>
      <AuthHydrationBoundary>{children}</AuthHydrationBoundary>
    </MobileThemeProvider>
  );
}
