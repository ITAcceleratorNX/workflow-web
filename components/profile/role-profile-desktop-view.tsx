"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import { ProfileDesktopSection } from "./profile-desktop-section";

/** Desktop role profile page — shared wrapper for admin-worker, manager, department-head. */
export function RoleProfileDesktopView() {
  const router = useRouter();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth < 768) {
      router.replace("/profile");
    }
  }, [router]);

  if (!isDesktop) return null;

  return (
    <div className="min-h-screen bg-[#1A1A1A] pb-20">
      <ProfileDesktopSection />
    </div>
  );
}
