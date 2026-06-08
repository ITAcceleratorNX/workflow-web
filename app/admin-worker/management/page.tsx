"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";

/** Desktop: redirect to home hub; mobile: redirect to `/admin-worker`. */
export default function ManagementPage() {
  const isDesktop = useIsDesktop();
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin-worker");
  }, [isDesktop, router]);

  return null;
}
