"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRoleNavConfig, isNavItemActive, type AdminManagerRole } from "@/lib/roleNavConfig";
import { Button } from "@/components/ui/button";

interface AdminManagerSidebarProps {
  role: AdminManagerRole;
  className?: string;
  /** Свёрнут ли сайдбар (только иконки) */
  collapsed?: boolean;
  /** Переключить свёрнутое состояние */
  onToggleCollapse?: () => void;
}

export function AdminManagerSidebar({
  role,
  className,
  collapsed = false,
  onToggleCollapse,
}: AdminManagerSidebarProps) {
  const pathname = usePathname();
  const navItems = getRoleNavConfig(role);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col shrink-0 bg-[#1A1A1A] border-r border-white/10 transition-[width] duration-200 ease-in-out overflow-hidden",
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
          <span className="font-bold text-sm text-white">WF</span>
        ) : (
          <>
            <span className="font-bold text-base lg:text-lg text-white">WorkFlow</span>
            <p className="text-xs text-white/60 mt-0.5">Система управления</p>
          </>
        )}
      </div>
      <nav className="flex-1 overflow-hidden overflow-x-hidden py-3 md:py-4 min-h-0">
        <ul className={cn("space-y-1", collapsed ? "px-2 flex flex-col items-center" : "px-2 md:px-3")}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isNavItemActive(item, pathname || "", role);
            return (
              <li key={item.key} className={cn("w-full", collapsed && "flex justify-center")}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-lg font-medium transition-colors",
                    collapsed
                      ? "justify-center w-10 h-10 mx-auto"
                      : "gap-2 lg:gap-3 px-2 md:px-3 py-2 md:py-2.5 text-xs lg:text-sm",
                    isActive
                      ? "bg-[#E85D2B] text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
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
