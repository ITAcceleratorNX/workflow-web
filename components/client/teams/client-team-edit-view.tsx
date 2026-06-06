"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TeamFormScreen } from "@/components/teams/team-form-screen";
import { useIsDesktop } from "@/hooks/use-media-query";

type ClientTeamEditViewProps = {
  teamId: number;
};

export function ClientTeamEditView({ teamId }: ClientTeamEditViewProps) {
  const router = useRouter();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (isDesktop) router.replace("/client");
  }, [isDesktop, router]);

  if (isDesktop) return null;

  return <TeamFormScreen teamId={teamId} />;
}
