"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DesktopManagementPage } from "@/components/layout/desktop-management-page";
import { DesktopOnlyNotice } from "@/components/org-structure/org-ui";
import { ADMIN_WORKER_MANAGEMENT_BACK_HREF } from "@/hooks/use-admin-worker-management-crud-page";
import { useIsDesktop } from "@/hooks/use-media-query";
import { getInteractionGroup, type InteractionGroup } from "@/lib/task-interaction-groups-api";
import { InteractionGroupEditor } from "./interaction-group-editor";
import { INTERACTION_GROUPS_HREF, InteractionGroupsListScreen } from "./interaction-groups-list-screen";

const TITLE = "Группы взаимодействия по задачам";

export function AdminWorkerInteractionGroupsView() {
  const isDesktop = useIsDesktop();
  const [headerSlot, setHeaderSlot] = useState<React.ReactNode>(null);
  if (!isDesktop) return <DesktopOnlyNotice title={TITLE} />;
  return (
    <DesktopManagementPage
      title={TITLE}
      description="Кто с кем связан и кто может ставить межкомпанейские задачи"
      backHref={ADMIN_WORKER_MANAGEMENT_BACK_HREF}
      actions={headerSlot}
    >
      <InteractionGroupsListScreen onRegisterHeaderSlot={setHeaderSlot} />
    </DesktopManagementPage>
  );
}

export function AdminWorkerInteractionGroupView() {
  const isDesktop = useIsDesktop();
  const params = useParams<{ groupId: string }>();
  const isNew = params?.groupId === "new";
  const groupId = Number(params?.groupId);
  const [group, setGroup] = useState<InteractionGroup | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    if (!Number.isFinite(groupId) || groupId < 1) {
      setError("Группа не найдена");
      return;
    }
    setGroup(null);
    void getInteractionGroup(groupId).then((res) => {
      if (res.ok) setGroup(res.data);
      else setError(res.error);
    });
  }, [isNew, groupId]);

  if (!isDesktop) return <DesktopOnlyNotice title={TITLE} />;

  return (
    <DesktopManagementPage
      title={isNew ? "Новая группа" : group?.display_name ?? "Группа"}
      backHref={INTERACTION_GROUPS_HREF}
      backLabel="К списку групп"
    >
      {isNew ? (
        <InteractionGroupEditor group={null} />
      ) : group ? (
        <InteractionGroupEditor key={`${group.id}-${group.updated_at}`} group={group} onGroupChange={setGroup} />
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#F35713]" />
        </div>
      )}
    </DesktopManagementPage>
  );
}
