"use client";

import { Suspense } from "react";
import { ProfileCalendarSyncView } from "@/components/profile/profile-calendar-sync-view";

export default function CalendarSettingsPage() {
  // useSearchParams (возврат от Google с ?calendar=…) требует Suspense при сборке.
  return (
    <Suspense>
      <ProfileCalendarSyncView />
    </Suspense>
  );
}
