import api from "@/lib/api";

export interface UserSearchItem {
  id: number;
  full_name: string;
  phone?: string;
  company_id?: number | null;
  company?: { id: number; name: string } | null;
}

export type AssignUserSearchScope = "company" | "office";

export interface SearchUsersForAssignOptions {
  scope?: AssignUserSearchScope;
  officeId?: number;
  companyId?: number;
}

export function normalizeUserSearchItem(raw: unknown): UserSearchItem {
  if (!raw || typeof raw !== "object") {
    return { id: 0, full_name: "Пользователь" };
  }
  const o = raw as Record<string, unknown>;
  const id = Number(o.id);
  const first = typeof o.first_name === "string" ? o.first_name.trim() : "";
  const last = typeof o.last_name === "string" ? o.last_name.trim() : "";
  const combined = [first, last].filter(Boolean).join(" ");
  const name =
    (typeof o.full_name === "string" && o.full_name.trim()) ||
    (typeof o.fullName === "string" && o.fullName.trim()) ||
    (typeof o.name === "string" && o.name.trim()) ||
    combined ||
    "";
  const safeId = Number.isFinite(id) ? id : 0;
  const companyRaw = o.company;
  let company: UserSearchItem["company"];
  if (companyRaw && typeof companyRaw === "object") {
    const c = companyRaw as Record<string, unknown>;
    const cid = Number(c.id);
    const cname = typeof c.name === "string" ? c.name.trim() : "";
    if (Number.isFinite(cid) && cname) {
      company = { id: cid, name: cname };
    }
  }
  const companyIdRaw = o.company_id;
  const company_id =
    companyIdRaw === null
      ? null
      : companyIdRaw != null && Number.isFinite(Number(companyIdRaw))
        ? Number(companyIdRaw)
        : undefined;
  return {
    id: safeId,
    full_name: name || (safeId > 0 ? `Пользователь #${safeId}` : "Пользователь"),
    phone: typeof o.phone === "string" ? o.phone : undefined,
    company_id,
    company: company ?? null,
  };
}

function extractError(error: unknown): string {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    "Ошибка запроса"
  );
}

export async function searchUsersForAssign(
  query: string,
  options: SearchUsersForAssignOptions = {},
): Promise<{ ok: true; data: UserSearchItem[] } | { ok: false; error: string }> {
  const q = query?.trim();
  if (!q || q.length < 2) return { ok: true, data: [] };
  const params: Record<string, string> = { q };
  if (options.scope) params.scope = options.scope;
  if (options.officeId != null) params.office_id = String(options.officeId);
  if (options.companyId != null) params.company_id = String(options.companyId);
  try {
    const res = await api.get<{ success: boolean; users: unknown[] }>("/users/search", {
      params,
    });
    const list = Array.isArray(res.data?.users) ? res.data.users : [];
    return {
      ok: true,
      data: list.map(normalizeUserSearchItem).filter((u) => u.id > 0),
    };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}
