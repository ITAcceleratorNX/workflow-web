"use client";

import { MobilePageLayout } from "@/components/layout/MobilePageLayout";
import { DEPARTMENT_HEAD_MANAGEMENT_BACK_HREF } from "@/hooks/use-department-head-management-crud-page";

interface DepartmentHeadManagementMobileLayoutProps {
  title: string;
  children: React.ReactNode;
  onRefresh?: () => Promise<void>;
  rightSlot?: React.ReactNode;
  inlineTitle?: boolean;
}

export function DepartmentHeadManagementMobileLayout({
  title,
  children,
  onRefresh,
  rightSlot,
  inlineTitle = false,
}: DepartmentHeadManagementMobileLayoutProps) {
  return (
    <MobilePageLayout
      title={title}
      backHref={DEPARTMENT_HEAD_MANAGEMENT_BACK_HREF}
      background="default"
      onRefresh={onRefresh}
      rightSlot={rightSlot}
      inlineTitle={inlineTitle}
    >
      <div className="admin-management-content">{children}</div>
    </MobilePageLayout>
  );
}
