"use client";

import { BottomNav } from "@/components/BottomNav";
import { useBottomNavLayout } from "@/hooks/use-bottom-nav-layout";

interface MobileRoleShellProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/** Mobile wrapper: content padding under absolute BottomNav + nav bar. */
export function MobileRoleShell({
  children,
  className = "min-h-screen bg-[#1C1C1E]",
  style,
}: MobileRoleShellProps) {
  const { paddingBottom } = useBottomNavLayout();

  return (
    <div className={className} style={{ ...style, paddingBottom }}>
      {children}
      <BottomNav />
    </div>
  );
}
