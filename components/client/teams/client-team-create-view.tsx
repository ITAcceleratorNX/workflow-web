"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { TeamFormScreen } from "@/components/teams/team-form-screen";
import { ClientTeamCreateDesktopView } from "./client-team-create-desktop-view";

export function ClientTeamCreateView() {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return <ClientTeamCreateDesktopView />;
  }

  return <TeamFormScreen />;
}
