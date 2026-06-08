"use client";

import { DesktopManagementPage } from "@/components/layout/desktop-management-page";
import { TeamFormScreen } from "@/components/teams/team-form-screen";

type ClientTeamEditDesktopViewProps = {
  teamId: number;
};

export function ClientTeamEditDesktopView({ teamId }: ClientTeamEditDesktopViewProps) {
  return (
    <DesktopManagementPage
      title="Команда"
      backHref="/client/tasks?tab=today&view=list"
      backLabel="К задачам"
    >
      <TeamFormScreen teamId={teamId} />
    </DesktopManagementPage>
  );
}
