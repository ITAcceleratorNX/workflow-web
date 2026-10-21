"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * Раскладка раздела роли: ждёт гидрации стора и отправляет на /login, если пользователя нет или
 * его роль не подходит. `ready` — можно рисовать раздел.
 */
export function useRoleGuard(isAllowed: (role: string) => boolean) {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const isDesktop = useIsDesktop();
  const [hydrated, setHydrated] = useState(false);
  const allowed = !!user && isAllowed(user.role);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !allowed) {
      clearAuth();
      router.push("/login");
    }
  }, [hydrated, allowed, router, clearAuth]);

  return { ready: hydrated && !!user, user, isDesktop, hydrated };
}
