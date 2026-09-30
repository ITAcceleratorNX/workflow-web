"use client";

import { useEffect, useState } from "react";
import { completeAuthHydration } from "@/lib/auth-hydration";
import { useAuthStore } from "@/stores/useAuthStore";

export function AuthHydrationBoundary({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    void completeAuthHydration(useAuthStore.persist).then(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Zustand uses its empty server snapshot during React hydration, even if
  // localStorage was already read. Mount guards only in a subsequent client render.
  return ready ? children : null;
}
