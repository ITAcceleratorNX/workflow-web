"use client";

import type { ReactNode } from "react";
import { StaffRoleLayout } from "@/components/layout/staff-role-layout";

export default function DepartmentHeadLayout({ children }: { children: ReactNode }) {
  return <StaffRoleLayout role="department-head">{children}</StaffRoleLayout>;
}
