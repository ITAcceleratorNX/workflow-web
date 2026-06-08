"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { AdminWorkerNewsEditorDesktop } from "@/components/admin-worker/management/news/admin-worker-news-editor-desktop";
import { AdminWorkerNewsEditorMobile } from "@/components/admin-worker/management/news/admin-worker-news-editor-mobile";

export default function AdminWorkerManagementNewsEditorPage() {
  const isDesktop = useIsDesktop();
  if (isDesktop) return <AdminWorkerNewsEditorDesktop />;
  return <AdminWorkerNewsEditorMobile />;
}
