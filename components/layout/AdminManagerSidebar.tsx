"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getRoleNavConfig, isNavItemActive, type AdminManagerRole } from "@/lib/roleNavConfig";

interface AdminManagerSidebarProps {
  role: AdminManagerRole;
  className?: string;
}

export function AdminManagerSidebar({ role, className }: AdminManagerSidebarProps) {
  const pathname = usePathname();
  const navItems = getRoleNavConfig(role);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col w-56 lg:w-64 shrink-0 bg-[#1A1A1A] border-r border-white/10",
        className
      )}
    >
      <div className="p-3 md:p-4 border-b border-white/10">
        <span className="font-bold text-base lg:text-lg text-white">WorkFlow</span>
        <p className="text-xs text-white/60 mt-0.5">Система управления</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 md:py-4 px-2 md:px-3 custom-scrollbar-dark">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isNavItemActive(item, pathname || "", role);
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 lg:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg text-xs lg:text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#E85D2B] text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
