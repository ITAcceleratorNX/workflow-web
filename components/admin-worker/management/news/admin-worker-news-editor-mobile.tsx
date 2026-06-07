"use client";

import { Suspense } from "react";
import { AdminWorkerNewsEditorScreen } from "@/components/admin-worker/news/admin-worker-news-editor-screen";
import { AdminWorkerManagementMobileLayout } from "../admin-worker-management-mobile-layout";

const NEWS_BACK_HREF = "/admin-worker/management/news";

function AdminWorkerNewsEditorContent() {
  return <AdminWorkerNewsEditorScreen />;
}

export function AdminWorkerNewsEditorMobile() {
  return (
    <AdminWorkerManagementMobileLayout title="Новость" backHref={NEWS_BACK_HREF}>
      <Suspense fallback={null}>
        <AdminWorkerNewsEditorContent />
      </Suspense>
    </AdminWorkerManagementMobileLayout>
  );
}
