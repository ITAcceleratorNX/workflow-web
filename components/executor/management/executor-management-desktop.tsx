"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Desktop: hub только на mobile; dashboard — `/executor`. */
export function ExecutorManagementDesktop() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/executor");
  }, [router]);

  return null;
}
