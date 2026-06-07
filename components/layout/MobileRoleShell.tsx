"use client";

import { BottomNav } from "@/components/BottomNav";
import { MOBILE_PAGE_BACKGROUND } from "@/constants/mobile-theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useBottomNavLayout } from "@/hooks/use-bottom-nav-layout";
import { cn } from "@/lib/utils";

interface MobileRoleShellProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/** Mobile wrapper: page background + content padding under absolute BottomNav + nav bar. */
export function MobileRoleShell({
  children,
  className,
  style,
}: MobileRoleShellProps) {
  const { paddingBottom } = useBottomNavLayout();
  const scheme = useColorScheme();
  const pageBg =
    scheme === "dark" ? MOBILE_PAGE_BACKGROUND.dark : MOBILE_PAGE_BACKGROUND.light;

  return (
    <div
      className={cn("min-h-screen min-h-[100dvh]", className)}
      style={{ backgroundColor: pageBg, paddingBottom, ...style }}
    >
      {children}
      <BottomNav />
    </div>
  );
}
