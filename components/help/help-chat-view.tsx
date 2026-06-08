"use client";

import { useAuthStore } from "@/stores/useAuthStore";
import { ClientDesktopShell } from "@/components/layout/ClientDesktopShell";
import { ExecutorDesktopShell } from "@/components/layout/ExecutorDesktopShell";
import { RoleDesktopShell } from "@/components/layout/RoleDesktopShell";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useHelpChatPage } from "@/hooks/use-help-chat-page";
import { HelpChatMobileView } from "./help-chat-mobile-view";

function wrapHelpDesktop(role: string | undefined, content: React.ReactNode) {
  switch (role) {
    case "client":
      return <ClientDesktopShell>{content}</ClientDesktopShell>;
    case "executor":
      return <ExecutorDesktopShell>{content}</ExecutorDesktopShell>;
    case "admin-worker":
      return <RoleDesktopShell role="admin-worker">{content}</RoleDesktopShell>;
    case "manager":
      return <RoleDesktopShell role="manager">{content}</RoleDesktopShell>;
    case "department-head":
      return <RoleDesktopShell role="department-head">{content}</RoleDesktopShell>;
    default:
      return content;
  }
}

export function HelpChatView() {
  const isDesktop = useIsDesktop();
  const { user } = useAuthStore();
  const state = useHelpChatPage();

  const content = <HelpChatMobileView {...state} isDesktop={isDesktop} />;

  if (isDesktop) {
    return wrapHelpDesktop(user?.role, content);
  }

  return content;
}
