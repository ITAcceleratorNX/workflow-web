"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";

export const DEPARTMENT_HEAD_MANAGEMENT_BACK_HREF = "/department-head";

/** Desktop: CRUD в dashboard на `/department-head`. */
export function useDepartmentHeadManagementCrudPage() {
  const router = useRouter();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (isDesktop) {
      router.replace("/department-head");
    }
  }, [isDesktop, router]);

  return { isDesktop };
}

export type UseDepartmentHeadManagementCrudPageResult = ReturnType<
  typeof useDepartmentHeadManagementCrudPage
>;
