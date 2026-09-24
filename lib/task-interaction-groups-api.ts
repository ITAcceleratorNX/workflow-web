import api from "@/lib/api";
import { extractApiError, type ApiResult } from "@/lib/org-structure-api";

/** Группы взаимодействия по задачам (Admin panel). */

export type InteractionMemberType = "company" | "department" | "user";
export type CreatorsMode = "all" | "selected";

export interface InteractionMemberInput {
  type: InteractionMemberType;
  company_id?: number;
  department_id?: number;
  user_id?: number;
}

export interface InteractionMember {
  type: InteractionMemberType;
  company_id: number | null;
  department_id: number | null;
  user_id: number | null;
  label: string;
  position?: string | null;
  office: { id: number; name: string } | null;
  company: { id: number; name: string } | null;
  is_active: boolean;
}

export interface InteractionCreator {
  user_id: number;
  full_name: string;
  position?: string | null;
  company: { id: number; name: string } | null;
  is_effective?: boolean;
}

export interface InteractionGroup {
  id: number;
  name: string | null;
  display_name: string;
  is_active: boolean;
  creators_mode: CreatorsMode;
  creators_count: number;
  members: InteractionMember[];
  creators: InteractionCreator[];
  created_at: string;
  updated_at: string;
  updated_by: { id: number; full_name: string } | null;
  effective_members_count?: number;
}

export interface InteractionGroupLogItem {
  id: number;
  action: string;
  details: unknown;
  created_at: string;
  actor: { id: number; full_name: string } | null;
}

export interface InteractionGroupFilters {
  q?: string;
  status?: "active" | "inactive" | "all";
  office_id?: number;
  company_id?: number;
  department_id?: number;
  user_id?: number;
  creator_id?: number;
}

export interface AccessBasis {
  group_id: number;
  via: InteractionMemberType;
}

export interface RecipientAccess {
  user: { id: number; full_name: string; company: { id: number; name: string } | null };
  can_use_external: boolean;
  group_ids: number[];
  companies: { id: number; name: string; office?: { id: number; name: string }; bases: AccessBasis[] }[];
  departments: { id: number; name: string; company?: { id: number; name: string }; bases: AccessBasis[] }[];
  users: {
    id: number;
    full_name: string;
    position?: string | null;
    company?: { id: number; name: string };
    department?: { id: number; name: string } | null;
    bases: AccessBasis[];
  }[];
}

export interface SaveGroupBody {
  name?: string | null;
  members: InteractionMemberInput[];
  creators_mode: CreatorsMode;
  creator_ids?: number[];
}

export type SaveGroupResult =
  | { ok: true; data: InteractionGroup }
  | { ok: false; error: string; duplicateGroupId?: number };

async function wrap<T>(fn: () => Promise<{ data: T }>): Promise<ApiResult<T>> {
  try {
    const res = await fn();
    return { ok: true, data: res.data };
  } catch (error) {
    return { ok: false, error: extractApiError(error) };
  }
}

async function wrapSave(fn: () => Promise<{ data: InteractionGroup }>): Promise<SaveGroupResult> {
  try {
    const res = await fn();
    return { ok: true, data: res.data };
  } catch (error) {
    const details = (error as { response?: { data?: { details?: { duplicate_group_id?: number } } } })
      ?.response?.data?.details;
    return {
      ok: false,
      error: extractApiError(error),
      duplicateGroupId:
        details && !Array.isArray(details) ? details.duplicate_group_id : undefined,
    };
  }
}

export async function listInteractionGroups(
  filters: InteractionGroupFilters = {},
): Promise<ApiResult<InteractionGroup[]>> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== "" && v !== "all"),
  );
  const res = await wrap<{ items: InteractionGroup[] }>(() =>
    api.get("/task-interaction-groups", { params }),
  );
  return res.ok ? { ok: true, data: res.data.items } : res;
}

export function getInteractionGroup(id: number): Promise<ApiResult<InteractionGroup>> {
  return wrap(() => api.get(`/task-interaction-groups/${id}`));
}

export function createInteractionGroup(body: SaveGroupBody): Promise<SaveGroupResult> {
  return wrapSave(() => api.post("/task-interaction-groups", body));
}

export function updateInteractionGroup(id: number, body: SaveGroupBody): Promise<SaveGroupResult> {
  return wrapSave(() => api.put(`/task-interaction-groups/${id}`, body));
}

export function setInteractionGroupActive(id: number, active: boolean): Promise<ApiResult<InteractionGroup>> {
  return wrap(() =>
    api.post(`/task-interaction-groups/${id}/${active ? "activate" : "deactivate"}`),
  );
}

export function listInteractionGroupLogs(
  id: number,
  params: { page?: number; limit?: number } = {},
): Promise<ApiResult<{ items: InteractionGroupLogItem[]; total: number }>> {
  return wrap(() => api.get(`/task-interaction-groups/${id}/logs`, { params }));
}

export function getUserRecipientAccess(userId: number): Promise<ApiResult<RecipientAccess>> {
  return wrap(() => api.get(`/task-interaction-groups/access/users/${userId}`));
}
