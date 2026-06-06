"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import { ProfileModal } from "@/components/ProfileModal";

export default function ManagerProfilePage() {
  const router = useRouter();
  const isDesktop = useIsDesktop();

  // На мобилке — тот же дизайн, что у department-head (общая страница /profile).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      router.replace("/profile");
    }
  }, [router]);

  if (!isDesktop) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] pb-20">
      <ProfileModal isOpen={true} onClose={() => {}} asSection={true} />
    </div>
  );
}