"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { ClientDesktopShell } from "@/components/layout/ClientDesktopShell";
import { ExecutorDesktopShell } from "@/components/layout/ExecutorDesktopShell";
import type { ProfileTab } from "@/constants/profile";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useProfilePage } from "@/hooks/use-profile-page";
import { useAuthStore } from "@/stores/useAuthStore";
import { ProfileDesktopSection } from "./profile-desktop-section";
import { ProfileMobileView } from "./profile-mobile-view";

export function ProfileView() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const { user, role } = useAuthStore();
  const profile = useProfilePage();
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user || !isDesktop) return;
    if (role === "admin-worker") {
      router.replace("/admin-worker/profile");
    } else if (role === "manager") {
      router.replace("/manager/profile");
    } else if (role === "department-head") {
      router.replace("/department-head/profile");
    }
  }, [user, isDesktop, role, router]);

  if (!user) return null;

  if (isDesktop && (role === "admin-worker" || role === "manager" || role === "department-head")) {
    return null;
  }

  if (isDesktop && role === "client") {
    return (
      <ClientDesktopShell>
        <div className="min-h-full bg-[#1A1A1A]">
          <ProfileDesktopSection />
        </div>
      </ClientDesktopShell>
    );
  }

  if (isDesktop && role === "executor") {
    return (
      <ExecutorDesktopShell>
        <div className="min-h-full bg-[#1A1A1A]">
          <ProfileDesktopSection />
        </div>
      </ExecutorDesktopShell>
    );
  }

  if (isDesktop) {
    return (
      <div className="min-h-screen bg-[#1A1A1A]">
        <ProfileDesktopSection />
      </div>
    );
  }

  return (
    <>
      <ProfileMobileView {...profile} activeTab={activeTab} onTabChange={setActiveTab} />
      <BottomNav activeTab="profile" />
    </>
  );
}
