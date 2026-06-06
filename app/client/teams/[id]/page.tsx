"use client";

import { useParams } from "next/navigation";
import { ClientTeamEditView } from "@/components/client/teams";

export default function ClientTeamEditPage() {
  const params = useParams();
  const id = Number(params.id);
  if (!Number.isFinite(id)) return null;
  return <ClientTeamEditView teamId={id} />;
}
