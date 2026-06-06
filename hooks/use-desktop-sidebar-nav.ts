'use client';

import { useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import type { AdminManagerRole } from '@/constants/roles';
import {
  CLIENT_DESKTOP_NAV,
  EXECUTOR_DESKTOP_NAV,
  getAdminManagerDesktopNav,
  isAdminManagerDesktopNavActive,
  isClientDesktopNavActive,
  isExecutorDesktopNavActive,
} from '@/constants/desktop-nav';
import type { DesktopSidebarItem } from '@/components/layout/DesktopSidebar';

export function useClientDesktopSidebarNav(): DesktopSidebarItem[] {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : '';

  return useMemo(
    () =>
      CLIENT_DESKTOP_NAV.map((item) => ({
        key: item.key,
        label: item.label,
        href: item.href,
        icon: item.icon,
        isActive: isClientDesktopNavActive(item, pathname || '', search),
      })),
    [pathname, search]
  );
}

export function useExecutorDesktopSidebarNav(): DesktopSidebarItem[] {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : '';

  return useMemo(
    () =>
      EXECUTOR_DESKTOP_NAV.map((item) => ({
        key: item.key,
        label: item.label,
        href: item.href,
        icon: item.icon,
        isActive: isExecutorDesktopNavActive(item, pathname || '', search),
      })),
    [pathname, search]
  );
}

export function useAdminManagerDesktopSidebarNav(
  role: AdminManagerRole
): DesktopSidebarItem[] {
  const pathname = usePathname();

  return useMemo(() => {
    const navItems = getAdminManagerDesktopNav(role);
    return navItems.map((item) => ({
      key: item.key,
      label: item.label,
      href: item.href,
      icon: item.icon,
      isActive: isAdminManagerDesktopNavActive(item, pathname || '', role),
    }));
  }, [pathname, role]);
}
