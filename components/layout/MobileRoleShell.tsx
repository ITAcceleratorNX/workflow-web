"use client";

import { BottomNav } from "@/components/BottomNav";
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

  return (
    <div
      className={cn("min-h-screen min-h-[100dvh] bg-background", className)}
      style={{ ...style, paddingBottom }}
    >
      {children}
      <BottomNav />
    </div>
  );
}
