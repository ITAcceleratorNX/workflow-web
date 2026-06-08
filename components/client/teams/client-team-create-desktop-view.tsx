"use client";

import { DesktopManagementPage } from "@/components/layout/desktop-management-page";
import { TeamFormScreen } from "@/components/teams/team-form-screen";

export function ClientTeamCreateDesktopView() {
  return (
    <DesktopManagementPage
      title="Создать команду"
      backHref="/client/tasks?tab=today&view=list"
      backLabel="К задачам"
    >
      <TeamFormScreen />
    </DesktopManagementPage>
  );
}
