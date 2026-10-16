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
import { useRequestActionCount } from '@/hooks/use-request-action-count';

/** Бейдж «Заявки» — только у раздела заявок. */
function badgeFor(key: string, requestActionCount: number): number | undefined {
  return key === 'requests' ? requestActionCount : undefined;
}

export function useClientDesktopSidebarNav(): DesktopSidebarItem[] {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : '';
  const requestActionCount = useRequestActionCount();

  return useMemo(
    () =>
      CLIENT_DESKTOP_NAV.map((item) => ({
        key: item.key,
        label: item.label,
        href: item.href,
        icon: item.icon,
        isActive: isClientDesktopNavActive(item, pathname || '', search),
        badgeCount: badgeFor(item.key, requestActionCount),
      })),
    [pathname, search, requestActionCount]
  );
}

export function useExecutorDesktopSidebarNav(): DesktopSidebarItem[] {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : '';
  const requestActionCount = useRequestActionCount();

  return useMemo(
    () =>
      EXECUTOR_DESKTOP_NAV.map((item) => ({
        key: item.key,
        label: item.label,
        href: item.href,
        icon: item.icon,
        isActive: isExecutorDesktopNavActive(item, pathname || '', search),
        badgeCount: badgeFor(item.key, requestActionCount),
      })),
    [pathname, search, requestActionCount]
  );
}

export function useAdminManagerDesktopSidebarNav(
  role: AdminManagerRole
): DesktopSidebarItem[] {
  const pathname = usePathname();
  const requestActionCount = useRequestActionCount();

  return useMemo(() => {
    const navItems = getAdminManagerDesktopNav(role);
    return navItems.map((item) => ({
      key: item.key,
      label: item.label,
      href: item.href,
      icon: item.icon,
      isActive: isAdminManagerDesktopNavActive(item, pathname || '', role),
      badgeCount: badgeFor(item.key, requestActionCount),
    }));
  }, [pathname, role, requestActionCount]);
}
