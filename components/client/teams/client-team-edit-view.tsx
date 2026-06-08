"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { TeamFormScreen } from "@/components/teams/team-form-screen";
import { ClientTeamEditDesktopView } from "./client-team-edit-desktop-view";

type ClientTeamEditViewProps = {
  teamId: number;
};

export function ClientTeamEditView({ teamId }: ClientTeamEditViewProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return <ClientTeamEditDesktopView teamId={teamId} />;
  }

  return <TeamFormScreen teamId={teamId} />;
}
