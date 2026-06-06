"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
/**
 * Раздел «Аккаунт» перенесён в Профиль.
 * Редирект: /admin-worker/account → /profile (мобилка) или /admin-worker (десктоп).
 */
export default function AdminAccountPage() {
  const router = useRouter();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (isDesktop) {
      router.replace("/admin-worker");
    } else {
      router.replace("/profile");
    }
  }, [isDesktop, router]);

  return null;
}
