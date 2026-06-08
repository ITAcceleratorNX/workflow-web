"use client";

import { Suspense } from "react";
import { AdminWorkerNewsEditorScreen } from "@/components/admin-worker/news/admin-worker-news-editor-screen";
import { DesktopManagementPage } from "@/components/layout/desktop-management-page";

const NEWS_BACK_HREF = "/admin-worker/management/news";

export function AdminWorkerNewsEditorDesktop() {
  return (
    <DesktopManagementPage title="Новость" backHref={NEWS_BACK_HREF}>
      <Suspense fallback={null}>
        <AdminWorkerNewsEditorScreen />
      </Suspense>
    </DesktopManagementPage>
  );
}
