"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatRequestActionBadge, requestActionBadgeLabel } from "@/lib/request-action-count";

export interface DesktopSidebarItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  /** Сколько заявок ждут действия пользователя; бейдж скрыт при 0. */
  badgeCount?: number;
}

interface DesktopSidebarProps {
  title: string;
  subtitle?: string;
  items: DesktopSidebarItem[];
  className?: string;
  /** Свёрнут ли сайдбар (только иконки) */
  collapsed?: boolean;
  /** Переключить свёрнутое состояние */
  onToggleCollapse?: () => void;
}

export function DesktopSidebar({
  title,
  subtitle,
  items,
  className,
  collapsed = false,
  onToggleCollapse,
}: DesktopSidebarProps) {
  return (
    <aside
      className={cn(
        "hidden md:flex flex-col shrink-0 fixed left-0 top-0 h-screen z-20 bg-[#1A1A1A] border-r border-white/10 transition-[width] duration-200 ease-in-out overflow-hidden",
        collapsed ? "w-[4.25rem]" : "w-56 lg:w-64",
        className
      )}
    >
      <div
        className={cn(
          "border-b border-white/10 flex shrink-0 p-3 md:p-4",
          collapsed ? "justify-center p-3" : "flex-col"
        )}
      >
        {collapsed ? (
          <span className="font-bold text-sm text-white">
            {title?.[0] ?? "W"}
            {title?.[1] ?? "F"}
          </span>
        ) : (
          <>
            <span className="font-bold text-base lg:text-lg text-white">{title}</span>
            {subtitle && <p className="text-xs text-white/60 mt-0.5">{subtitle}</p>}
          </>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 md:py-4 min-h-0 custom-scrollbar-dark">
        <ul
          className={cn(
            "space-y-1",
            collapsed ? "px-2 flex flex-col items-center" : "px-2 md:px-3"
          )}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const badge = formatRequestActionBadge(item.badgeCount);
            return (
              <li key={item.key} className={cn("w-full", collapsed && "flex justify-center")}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  aria-label={
                    badge && item.badgeCount
                      ? `${item.label}. ${requestActionBadgeLabel(item.badgeCount)}`
                      : undefined
                  }
                  className={cn(
                    "flex items-center rounded-lg font-medium transition-colors",
                    collapsed
                      ? "justify-center w-10 h-10 mx-auto"
                      : "gap-2 lg:gap-3 px-2 md:px-3 py-2 md:py-2.5 text-xs lg:text-sm",
                    item.isActive
                      ? "bg-[#E85D2B] text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <span className="relative flex shrink-0">
                    <Icon className="w-5 h-5 shrink-0" />
                    {badge && collapsed && (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E85D2B] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[#1A1A1A]"
                      >
                        {badge}
                      </span>
                    )}
                  </span>
                  {!collapsed && <span className="min-w-0 truncate">{item.label}</span>}
                  {badge && !collapsed && (
                    <span
                      aria-hidden
                      className={cn(
                        "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold leading-none",
                        item.isActive ? "bg-white text-[#E85D2B]" : "bg-[#E85D2B] text-white"
                      )}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {onToggleCollapse && (
        <div className={cn("p-2 border-t border-white/10", collapsed && "flex justify-center")}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className={cn(
              "text-white/80 hover:bg-white/10 hover:text-white w-full",
              collapsed && "w-10 h-10 p-0 mx-auto"
            )}
            title={collapsed ? "Развернуть меню" : "Свернуть меню"}
          >
            {collapsed ? (
              <PanelLeft className="w-5 h-5 shrink-0" />
            ) : (
              <PanelLeftClose className="w-5 h-5 shrink-0" />
            )}
          </Button>
        </div>
      )}
    </aside>
  );
}

