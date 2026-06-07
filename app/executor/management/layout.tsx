"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useIsDesktop } from "@/hooks/use-media-query";
import Header from "@/app/header/Header";
import { MobileRoleShell } from "@/components/layout/MobileRoleShell";

export default function ExecutorManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isDesktop = useIsDesktop();
  const { user, clearAuth } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!user || user.role !== "executor") {
      clearAuth();
      router.push("/login");
    }
  }, [hydrated, user, router, clearAuth]);

  useEffect(() => {
    if (!isDesktop && pathname?.startsWith("/executor/management")) {
      document.body.classList.add("admin-management-mobile");
    } else {
      document.body.classList.remove("admin-management-mobile");
    }
    return () => document.body.classList.remove("admin-management-mobile");
  }, [pathname, isDesktop]);

  const handleLogout = async () => {
    try {
      clearAuth();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!hydrated || !user) {
    return null;
  }

  return (
    <>
      <Header handleLogout={handleLogout} notificationCount={0} role="Исполнитель" />
      <MobileRoleShell>{children}</MobileRoleShell>
    </>
  );
}
