"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DesktopManagementPage } from "@/components/layout/desktop-management-page";
import { ADMIN_WORKER_MANAGEMENT_BACK_HREF } from "@/hooks/use-admin-worker-management-crud-page";
import { useIsDesktop } from "@/hooks/use-media-query";
import { getOrgCompany, type OrgCompanyDetails } from "@/lib/org-structure-api";
import { DesktopOnlyNotice } from "./org-ui";
import { STRUCTURE_BASE_HREF, StructureCompaniesScreen } from "./structure-companies-screen";
import { StructureCompanyScreen } from "./structure-company-screen";

export function AdminWorkerStructureView() {
  const isDesktop = useIsDesktop();
  const [headerSlot, setHeaderSlot] = useState<React.ReactNode>(null);
  if (!isDesktop) return <DesktopOnlyNotice title="Структура" />;
  return (
    <DesktopManagementPage
      title="Структура"
      description="Офис → Компания → Отдел → Сотрудники"
      backHref={ADMIN_WORKER_MANAGEMENT_BACK_HREF}
      actions={headerSlot}
    >
      <Suspense fallback={null}>
        <StructureCompaniesScreen onRegisterHeaderSlot={setHeaderSlot} />
      </Suspense>
    </DesktopManagementPage>
  );
}

export function AdminWorkerStructureCompanyView() {
  const isDesktop = useIsDesktop();
  const params = useParams<{ companyId: string }>();
  const companyId = Number(params?.companyId);
  const [company, setCompany] = useState<OrgCompanyDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(companyId) || companyId < 1) {
      setError("Компания не найдена");
      return;
    }
    const res = await getOrgCompany(companyId);
    if (res.ok) setCompany(res.data);
    else setError(res.error);
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isDesktop) return <DesktopOnlyNotice title="Структура компании" />;

  return (
    <DesktopManagementPage
      title={company ? company.name : "Компания"}
      description="Отделы, сотрудники и руководители"
      backHref={company ? `${STRUCTURE_BASE_HREF}?office=${company.office_id}` : STRUCTURE_BASE_HREF}
      backLabel="К компаниям офиса"
    >
      {company ? (
        <StructureCompanyScreen company={company} onCompanyChange={setCompany} />
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
