"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useSupportChatPage, type SupportChatMode } from "@/hooks/use-support-chat-page";
import { ClientDesktopShell } from "@/components/layout/ClientDesktopShell";
import { RoleDesktopShell } from "@/components/layout/RoleDesktopShell";
import { AdminManagerMessagesDesktop } from "@/components/layout/AdminManagerMessagesDesktop";
import { useAuthStore } from "@/stores/useAuthStore";
import { SupportChatMobileView } from "./support-chat-mobile-view";

type SupportChatViewProps = {
  ticketId: number;
  mode: SupportChatMode;
};

export function SupportChatView({ ticketId, mode }: SupportChatViewProps) {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const { user } = useAuthStore();
  const state = useSupportChatPage(ticketId, mode);

  useEffect(() => {
    if (mode === "client" && isDesktop && user?.role !== "client" && user?.role !== "department-head") {
      router.replace("/chat-bot?tab=support");
    }
  }, [isDesktop, mode, router, user?.role]);

  const content = (
    <SupportChatMobileView
      {...state}
      isDesktop={isDesktop}
      showBottomNav={mode === "client"}
    />
  );

  if (isDesktop && mode === "admin") {
    return <AdminManagerMessagesDesktop canRespond={true} />;
  }

  if (isDesktop && user?.role === "client") {
    return <ClientDesktopShell>{content}</ClientDesktopShell>;
  }

  if (isDesktop && user?.role === "department-head") {
    return <RoleDesktopShell role="department-head">{content}</RoleDesktopShell>;
  }

  return content;
}
