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
  /** «Назад» вместо перехода по backHref: например, чтобы переспросить о несохранённых правках. */
  onBack?: () => void;
}

export function AdminWorkerManagementMobileLayout({
  title,
  children,
  onRefresh,
  rightSlot,
  inlineTitle = false,
  backHref = ADMIN_WORKER_MANAGEMENT_BACK_HREF,
  onBack,
}: AdminWorkerManagementMobileLayoutProps) {
  return (
    <MobilePageLayout
      title={title}
      backHref={backHref}
      onBack={onBack}
      background="default"
      onRefresh={onRefresh}
      rightSlot={rightSlot}
      inlineTitle={inlineTitle}
    >
      <div className="admin-management-content">{children}</div>
    </MobilePageLayout>
  );
}
