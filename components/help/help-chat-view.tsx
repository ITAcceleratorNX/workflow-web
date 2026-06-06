"use client";

import { useAuthStore } from "@/stores/useAuthStore";
import { ClientDesktopShell } from "@/components/layout/ClientDesktopShell";
import { RoleDesktopShell } from "@/components/layout/RoleDesktopShell";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useHelpChatPage } from "@/hooks/use-help-chat-page";
import { HelpChatMobileView } from "./help-chat-mobile-view";

export function HelpChatView() {
  const isDesktop = useIsDesktop();
  const { user } = useAuthStore();
  const state = useHelpChatPage();

  const content = <HelpChatMobileView {...state} isDesktop={isDesktop} />;

  if (isDesktop && user?.role === "client") {
    return <ClientDesktopShell>{content}</ClientDesktopShell>;
  }
  if (isDesktop && user?.role === "department-head") {
    return <RoleDesktopShell role="department-head">{content}</RoleDesktopShell>;
  }

  return content;
}
