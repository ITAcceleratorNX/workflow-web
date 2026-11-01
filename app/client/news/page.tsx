"use client";

import { Suspense } from "react";
import { ClientNewsView } from "@/components/client/news";

export default function ClientNewsPage() {
  // The tab «Новости | Опросы» comes from the address (useSearchParams).
  return (
    <Suspense fallback={null}>
      <ClientNewsView />
    </Suspense>
  );
}
