"use client";

import { Suspense } from "react";
import { AdminWorkerNewsView } from "@/components/admin-worker/management/news/admin-worker-news-view";

export default function AdminWorkerManagementNewsPage() {
  // Вкладка «Новости | Опросы» читается из адреса (useSearchParams).
  return (
    <Suspense fallback={null}>
      <AdminWorkerNewsView />
    </Suspense>
  );
}
