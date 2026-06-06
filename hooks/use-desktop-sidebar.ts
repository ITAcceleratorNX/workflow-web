'use client';

import { useCallback, useEffect, useState } from 'react';
import type { DesktopSidebarStorageKey } from '@/constants/roles';

export interface UseDesktopSidebarCollapsedResult {
  collapsed: boolean;
  toggle: () => void;
}

/**
 * Persisted collapsed state for desktop sidebar (localStorage).
 */
export function useDesktopSidebarCollapsed(
  storageKey: DesktopSidebarStorageKey
): UseDesktopSidebarCollapsedResult {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) setCollapsed(stored === 'true');
  }, [storageKey]);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(storageKey, String(next));
      } catch {
        // ignore quota / private mode
      }
      return next;
    });
  }, [storageKey]);

  return { collapsed, toggle };
}
