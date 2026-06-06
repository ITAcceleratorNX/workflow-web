"use client";

import { useAdminWorkerAccount } from "@/hooks/use-admin-worker-account";

/** Legacy redirect: /admin-worker/account → /profile (mobile) or /admin-worker (desktop). */
export function AdminWorkerAccountView() {
  useAdminWorkerAccount();
  return null;
}
