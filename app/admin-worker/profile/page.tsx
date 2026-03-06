"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@/hooks/use-media-query";
import { BottomNav } from "@/components/BottomNav";
import { ProfileModal } from "@/components/ProfileModal";

export default function AdminProfilePage() {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <div className="min-h-screen bg-[#1A1A1A] pb-20">
      {isDesktop ? (
        <ProfileModal isOpen={true} onClose={() => {}} asSection={true} />
      ) : (
        <div className="w-full max-w-[420px] mx-auto px-4 py-6">
          <ProfileModal isOpen={true} onClose={() => router.back()} isFullScreen={true} />
        </div>
      )}
      {!isDesktop && <BottomNav activeTab="profile" />}
    </div>
  );
}
