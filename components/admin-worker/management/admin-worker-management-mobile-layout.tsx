"use client";

import { MobilePageLayout } from "@/components/layout/MobilePageLayout";
import { ADMIN_WORKER_MANAGEMENT_BACK_HREF } from "@/hooks/use-admin-worker-management-crud-page";

interface AdminWorkerManagementMobileLayoutProps {
  title: string;
  children: React.ReactNode;
  onRefresh?: () => Promise<void>;
}

export function AdminWorkerManagementMobileLayout({
  title,
  children,
  onRefresh,
}: AdminWorkerManagementMobileLayoutProps) {
  return (
    <MobilePageLayout
      title={title}
      backHref={ADMIN_WORKER_MANAGEMENT_BACK_HREF}
      background="default"
      onRefresh={onRefresh}
    >
      <div className="admin-management-content">{children}</div>
    </MobilePageLayout>
  );
}
