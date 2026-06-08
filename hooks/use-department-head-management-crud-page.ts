"use client";

/** Back link target for department-head management CRUD pages. */
export const DEPARTMENT_HEAD_MANAGEMENT_BACK_HREF = "/department-head";

/** @deprecated Redirect removed — views branch on isDesktop. */
export function useDepartmentHeadManagementCrudPage() {
  return { isDesktop: false };
}

export type UseDepartmentHeadManagementCrudPageResult = ReturnType<
  typeof useDepartmentHeadManagementCrudPage
>;
