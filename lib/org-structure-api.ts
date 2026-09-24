import api from "@/lib/api";

/** Оргструктура офиса: Офис → Компания → Отдел → Сотрудники (Admin panel). */

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export interface OrgUserBrief {
  id: number;
  full_name: string;
  position?: string | null;
}

export interface OrgCompanyListItem {
  id: number;
  office_id: number;
  name: string;
  is_active: boolean;
  head: OrgUserBrief | null;
  employees_count: number;
  departments_count: number;
  created_at: string;
  updated_at: string;
  deactivated_at: string | null;
}

export interface OrgDepartment {
  id: number;
  company_id: number;
  name: string;
  is_active: boolean;
  head: OrgUserBrief | null;
  employees_count: number;
  created_at: string;
  updated_at: string;
  deactivated_at: string | null;
}

export interface OrgCompanyDetails extends OrgCompanyListItem {
  office: { id: number; name: string } | null;
  no_department_count: number;
  departments: OrgDepartment[];
}

export interface OrgEmployee {
  id: number;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  position?: string | null;
  company_id: number;
  department_id: number | null;
  department?: { id: number; name: string; is_active: boolean } | null;
  is_company_head: boolean;
  head_of_departments: { id: number; name: string; is_active: boolean }[];
}

export interface OrgCandidate {
  id: number;
  full_name: string;
  phone?: string | null;
  position?: string | null;
  company_id: number | null;
  company?: { id: number; name: string; is_active: boolean } | null;
}

export interface OrgStructureLogItem {
  id: number;
  action: string;
  entity_type: "company" | "department" | "employee";
  entity_id: number | null;
  entity_name: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
  actor: { id: number; full_name: string } | null;
  targetUser: { id: number; full_name: string } | null;
}

export type CompanyStatusFilter = "active" | "inactive" | "all";

/** Спец-значение фильтра сотрудников: системная группа «Без отдела». */
export const NO_DEPARTMENT = "none" as const;
export type DepartmentFilter = number | typeof NO_DEPARTMENT | null;

export function extractApiError(error: unknown, fallback = "Ошибка запроса"): string {
  const data = (error as { response?: { data?: { message?: string; error?: string; details?: unknown } } })
    ?.response?.data;
  if (Array.isArray(data?.details) && data.details.length > 0) {
    const first = data.details[0] as { message?: string };
    if (first?.message) return first.message;
  }
  return data?.message || data?.error || fallback;
}

async function wrap<T>(fn: () => Promise<{ data: T }>): Promise<ApiResult<T>> {
  try {
    const res = await fn();
    return { ok: true, data: res.data };
  } catch (error) {
    return { ok: false, error: extractApiError(error) };
  }
}

export function listOrgCompanies(
  officeId: number,
  params: { q?: string; status?: CompanyStatusFilter } = {},
): Promise<ApiResult<{ office: { id: number; name: string }; items: OrgCompanyListItem[] }>> {
  return wrap(() => api.get(`/org-structure/offices/${officeId}/companies`, { params }));
}

export function createOrgCompany(
  officeId: number,
  body: { name: string; head_user_id?: number | null },
): Promise<ApiResult<OrgCompanyDetails>> {
  return wrap(() => api.post(`/org-structure/offices/${officeId}/companies`, body));
}

export async function searchOfficeFreeUsers(officeId: number, q: string): Promise<OrgCandidate[]> {
  const res = await wrap<{ items: OrgCandidate[] }>(() =>
    api.get(`/org-structure/offices/${officeId}/free-users`, { params: { q } }),
  );
  return res.ok ? res.data.items : [];
}

export function getOrgCompany(companyId: number): Promise<ApiResult<OrgCompanyDetails>> {
  return wrap(() => api.get(`/org-structure/companies/${companyId}`));
}

export function updateOrgCompany(
  companyId: number,
  body: { name?: string; head_user_id?: number | null },
): Promise<ApiResult<OrgCompanyDetails>> {
  return wrap(() => api.patch(`/org-structure/companies/${companyId}`, body));
}

export function setOrgCompanyActive(companyId: number, active: boolean): Promise<ApiResult<OrgCompanyDetails>> {
  return wrap(() =>
    api.post(`/org-structure/companies/${companyId}/${active ? "activate" : "deactivate"}`),
  );
}

export function createOrgDepartment(
  companyId: number,
  body: { name: string; head_user_id?: number | null },
): Promise<ApiResult<OrgCompanyDetails>> {
  return wrap(() => api.post(`/org-structure/companies/${companyId}/departments`, body));
}

export function updateOrgDepartment(
  departmentId: number,
  body: { name?: string; head_user_id?: number | null },
): Promise<ApiResult<OrgCompanyDetails>> {
  return wrap(() => api.patch(`/org-structure/departments/${departmentId}`, body));
}

export function setOrgDepartmentActive(
  departmentId: number,
  active: boolean,
): Promise<ApiResult<OrgCompanyDetails>> {
  return wrap(() =>
    api.post(`/org-structure/departments/${departmentId}/${active ? "activate" : "deactivate"}`),
  );
}

export async function listOrgEmployees(
  companyId: number,
  params: { department?: DepartmentFilter; q?: string } = {},
): Promise<ApiResult<OrgEmployee[]>> {
  const res = await wrap<{ items: OrgEmployee[] }>(() =>
    api.get(`/org-structure/companies/${companyId}/employees`, {
      params: {
        department: params.department ?? undefined,
        q: params.q || undefined,
      },
    }),
  );
  return res.ok ? { ok: true, data: res.data.items } : res;
}

export async function searchOrgCandidates(companyId: number, q: string): Promise<OrgCandidate[]> {
  const res = await wrap<{ items: OrgCandidate[] }>(() =>
    api.get(`/org-structure/companies/${companyId}/candidates`, { params: { q } }),
  );
  return res.ok ? res.data.items : [];
}

export function addOrgEmployee(
  companyId: number,
  body: { user_id: number; department_id?: number | null },
): Promise<ApiResult<OrgCompanyDetails>> {
  return wrap(() => api.post(`/org-structure/companies/${companyId}/employees`, body));
}

export function changeOrgEmployeeDepartment(
  companyId: number,
  userId: number,
  departmentId: number | null,
): Promise<ApiResult<OrgCompanyDetails>> {
  return wrap(() =>
    api.patch(`/org-structure/companies/${companyId}/employees/${userId}`, {
      department_id: departmentId,
    }),
  );
}

export function removeOrgEmployee(companyId: number, userId: number): Promise<ApiResult<OrgCompanyDetails>> {
  return wrap(() => api.delete(`/org-structure/companies/${companyId}/employees/${userId}`));
}

export function listOrgCompanyLogs(
  companyId: number,
  params: { page?: number; limit?: number } = {},
): Promise<ApiResult<{ items: OrgStructureLogItem[]; total: number; page: number; limit: number }>> {
  return wrap(() => api.get(`/org-structure/companies/${companyId}/logs`, { params }));
}
