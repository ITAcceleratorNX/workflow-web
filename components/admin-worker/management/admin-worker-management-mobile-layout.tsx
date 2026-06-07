"use client";

import { MobilePageLayout } from "@/components/layout/MobilePageLayout";
import { ADMIN_WORKER_MANAGEMENT_BACK_HREF } from "@/hooks/use-admin-worker-management-crud-page";

interface AdminWorkerManagementMobileLayoutProps {
  title: string;
  children: React.ReactNode;
  onRefresh?: () => Promise<void>;
  rightSlot?: React.ReactNode;
  inlineTitle?: boolean;
  backHref?: string;
}

export function AdminWorkerManagementMobileLayout({
  title,
  children,
  onRefresh,
  rightSlot,
  inlineTitle = false,
  backHref = ADMIN_WORKER_MANAGEMENT_BACK_HREF,
}: AdminWorkerManagementMobileLayoutProps) {
  return (
    <MobilePageLayout
      title={title}
      backHref={backHref}
      background="default"
      onRefresh={onRefresh}
      rightSlot={rightSlot}
      inlineTitle={inlineTitle}
    >
      <div className="admin-management-content">{children}</div>
    </MobilePageLayout>
  );
}
