"use client";

import { useAdminWorkerManagementCrudPage } from "@/hooks/use-admin-worker-management-crud-page";
import { AdminWorkerNewsEditorMobile } from "@/components/admin-worker/management/news/admin-worker-news-editor-mobile";

export default function AdminWorkerManagementNewsEditorPage() {
  const { isDesktop } = useAdminWorkerManagementCrudPage();

  if (isDesktop) {
    return null;
  }

  return <AdminWorkerNewsEditorMobile />;
}
