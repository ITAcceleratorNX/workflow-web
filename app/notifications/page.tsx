"use client";

import { Suspense } from "react";
import { NotificationsView } from "@/components/notification/notifications-view";

export default function NotificationsPage() {
  // useSearchParams (категория в адресе) требует Suspense для сборки страницы.
  return (
    <Suspense fallback={null}>
      <NotificationsView />
    </Suspense>
  );
}
