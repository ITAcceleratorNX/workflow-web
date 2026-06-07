"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { getRequestsListPath } from "@/constants/roles";

/**
 * Legacy `/requests` — redirect to role-specific requests list (4.10).
 * Client/guest → `/client/requests`, other roles → `/{role}/requests`.
 */
export default function LegacyRequestsRedirectPage() {
  const router = useRouter();
  const { user, role, isGuest } = useAuthStore();

  useEffect(() => {
    if (!user && !isGuest) {
      router.replace("/login");
      return;
    }

    const targetRole = user?.role ?? role ?? "client";
    router.replace(getRequestsListPath(targetRole));
  }, [router, user, role, isGuest]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#040404]">
      <div className="w-8 h-8 border-2 border-[#F35713]/50 border-t-[#F35713] rounded-full animate-spin" />
    </div>
  );
}
