"use client";

import { RequestsTabs } from "@/components/requests/requests-tabs";
import {
  ADMIN_WORKER_REQUEST_TABS,
  type AdminWorkerRequestsTab,
} from "./admin-worker-requests-constants";

interface AdminWorkerRequestsTabsProps {
  activeTab: AdminWorkerRequestsTab;
  onTabChange: (tab: AdminWorkerRequestsTab) => void;
  variant?: "mobile" | "desktop";
}

export function AdminWorkerRequestsTabs(props: AdminWorkerRequestsTabsProps) {
  return <RequestsTabs tabs={ADMIN_WORKER_REQUEST_TABS} {...props} />;
}
