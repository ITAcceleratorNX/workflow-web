"use client";

import { MobilePageLayout } from "@/components/layout/MobilePageLayout";
import { DEPARTMENT_HEAD_MANAGEMENT_BACK_HREF } from "@/hooks/use-department-head-management-crud-page";

interface DepartmentHeadManagementMobileLayoutProps {
  title: string;
  children: React.ReactNode;
  onRefresh?: () => Promise<void>;
}

export function DepartmentHeadManagementMobileLayout({
  title,
  children,
  onRefresh,
}: DepartmentHeadManagementMobileLayoutProps) {
  return (
    <MobilePageLayout
      title={title}
      backHref={DEPARTMENT_HEAD_MANAGEMENT_BACK_HREF}
      background="default"
      onRefresh={onRefresh}
    >
      <div className="admin-management-content">{children}</div>
    </MobilePageLayout>
  );
}
