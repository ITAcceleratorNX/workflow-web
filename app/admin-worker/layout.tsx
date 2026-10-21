"use client";

import type { ReactNode } from "react";
import { StaffRoleLayout } from "@/components/layout/staff-role-layout";

export default function AdminWorkerLayout({ children }: { children: ReactNode }) {
  return <StaffRoleLayout role="admin-worker">{children}</StaffRoleLayout>;
}
