import api, { getExecutorsByCategory as getExecutorsByCategoryRequest } from "@/lib/api";

function extractError(error: unknown): string {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    "Ошибка запроса"
  );
}

export interface OfficeUser {
  id: number;
  full_name: string;
  phone: string;
  role: string;
  office_id?: number;
  office?: { id: number; name: string };
  company_id?: number | null;
  company?: { id: number; name: string } | null;
}

export interface ExecutorInCategory {
  id: number;
  specialty: string;
  department_id?: number;
  user?: {
    id: number;
    full_name: string;
    phone?: string;
    role?: string;
    office_id?: number;
  };
  serviceCategories?: Array<{ id: number; name: string }>;
}

function normalizeManagementUser(raw: unknown): OfficeUser | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = Number(o.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  const first = typeof o.first_name === "string" ? o.first_name.trim() : "";
  const last = typeof o.last_name === "string" ? o.last_name.trim() : "";
  const combined = [first, last].filter(Boolean).join(" ");
  const full_name =
    (typeof o.full_name === "string" && o.full_name.trim()) ||
    (typeof o.fullName === "string" && o.fullName.trim()) ||
    combined ||
    `Пользователь #${id}`;
  const phone = typeof o.phone === "string" ? o.phone : "";
  const role = typeof o.role === "string" ? o.role : "";
  const officeIdRaw = o.office_id ?? o.officeId;
  const office_id =
    typeof officeIdRaw === "number" && Number.isFinite(officeIdRaw)
      ? officeIdRaw
      : typeof officeIdRaw === "string" && officeIdRaw.trim() !== ""
        ? Number(officeIdRaw)
        : undefined;
  let office: { id: number; name: string } | undefined;
  const off = o.office;
  if (off && typeof off === "object") {
    const oo = off as Record<string, unknown>;
    const oid = Number(oo.id);
    const oname = typeof oo.name === "string" ? oo.name : "";
    if (Number.isFinite(oid) && oname) office = { id: oid, name: oname };
  }
  const companyIdRaw = o.company_id ?? o.companyId;
  const company_id =
    typeof companyIdRaw === "number" && Number.isFinite(companyIdRaw)
      ? companyIdRaw
      : typeof companyIdRaw === "string" && companyIdRaw.trim() !== ""
        ? Number(companyIdRaw)
        : null;
  let company: { id: number; name: string } | null = null;
  const co = o.company;
  if (co && typeof co === "object") {
    const cc = co as Record<string, unknown>;
    const cid = Number(cc.id);
    const cname = typeof cc.name === "string" ? cc.name : "";
    if (Number.isFinite(cid) && cname) company = { id: cid, name: cname };
  }
  return { id, full_name, phone, role, office_id, office, company_id, company };
}

export function normalizeExecutorInCategory(raw: unknown): ExecutorInCategory | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = Number(o.id);
  if (!Number.isFinite(id) || id <= 0) return null;

  const specialty =
    (typeof o.specialty === "string" && o.specialty) ||
    (typeof o.Specialty === "string" && o.Specialty) ||
    "";

  const categoriesRaw = o.serviceCategories ?? o.service_categories;
  const serviceCategories = Array.isArray(categoriesRaw)
    ? categoriesRaw
        .map((c) => {
          if (!c || typeof c !== "object") return null;
          const cat = c as Record<string, unknown>;
          const catId = Number(cat.id);
          const name = typeof cat.name === "string" ? cat.name : "";
          return Number.isFinite(catId) && name ? { id: catId, name } : null;
        })
        .filter((c): c is { id: number; name: string } => c !== null)
    : [];

  let user: ExecutorInCategory["user"];
  const userRaw = o.user;
  if (userRaw && typeof userRaw === "object") {
    const u = userRaw as Record<string, unknown>;
    const userId = Number(u.id);
    if (Number.isFinite(userId)) {
      user = {
        id: userId,
        full_name:
          (typeof u.full_name === "string" && u.full_name) ||
          (typeof u.fullName === "string" && u.fullName) ||
          "",
        phone: typeof u.phone === "string" ? u.phone : undefined,
        role: typeof u.role === "string" ? u.role : undefined,
        office_id:
          typeof u.office_id === "number"
            ? u.office_id
            : typeof u.officeId === "number"
              ? u.officeId
              : undefined,
      };
    }
  }

  return {
    id,
    specialty,
    department_id:
      typeof o.department_id === "number"
        ? o.department_id
        : typeof o.departmentId === "number"
          ? o.departmentId
          : undefined,
    user,
    serviceCategories,
  };
}

const USERS_MANAGEMENT_PAGE_SIZE = 100;

export async function getUsersForManagement(options?: {
  officeId?: string;
  companyId?: string;
}): Promise<{ ok: true; data: OfficeUser[] } | { ok: false; error: string }> {
  try {
    const officeId = options?.officeId?.trim();
    const companyId = options?.companyId?.trim();
    const all: OfficeUser[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(USERS_MANAGEMENT_PAGE_SIZE),
      };
      if (officeId) params.office_id = officeId;
      if (companyId) params.company_id = companyId;

      const res = await api.get<{
        success?: boolean;
        users?: unknown[];
        total?: number;
        totalPages?: number;
        currentPage?: number;
      }>("/users", { params });

      const body = res.data;
      const users = Array.isArray(body?.users) ? body.users : [];
      const rawTp = typeof body?.totalPages === "number" ? body.totalPages : 1;
      totalPages = rawTp < 1 ? 1 : rawTp;

      for (const row of users) {
        const u = normalizeManagementUser(row);
        if (u) all.push(u);
      }

      page += 1;
      if (page > 2000) {
        return { ok: false, error: "Слишком большой список пользователей" };
      }
    } while (page <= totalPages);

    all.sort((a, b) => a.full_name.localeCompare(b.full_name, "ru"));
    return { ok: true, data: all };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function getExecutors(
  categoryId?: number,
  officeId?: number,
): Promise<{ ok: true; data: ExecutorInCategory[] } | { ok: false; error: string }> {
  try {
    const params: Record<string, string> = {};
    if (categoryId != null) params.categoryId = String(categoryId);
    if (officeId != null) params.office_id = String(officeId);
    const res = await api.get<ExecutorInCategory[] | ExecutorInCategory>("/executors", {
      params,
    });
    const data = res.data;
    const rawList = Array.isArray(data) ? data : data ? [data] : [];
    const list = rawList
      .map(normalizeExecutorInCategory)
      .filter((e): e is ExecutorInCategory => e !== null);
    return { ok: true, data: list };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function getExecutorByUserId(
  userId: number,
): Promise<{ ok: true; data: ExecutorInCategory } | { ok: false; error: string }> {
  try {
    const res = await api.get<unknown>(`/executors/${userId}/user`);
    const normalized = normalizeExecutorInCategory(res.data);
    if (!normalized) return { ok: false, error: "Некорректный ответ сервера" };
    return { ok: true, data: normalized };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function updateExecutor(
  executorId: number,
  payload: { full_name?: string; phone?: string; specialty?: string; category_ids?: number[] },
): Promise<{ ok: true; data: ExecutorInCategory } | { ok: false; error: string }> {
  try {
    const res = await api.put<ExecutorInCategory>(`/executors/${executorId}`, payload);
    const normalized = normalizeExecutorInCategory(res.data);
    if (!normalized) return { ok: false, error: "Некорректный ответ сервера" };
    return { ok: true, data: normalized };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function getExecutorsByCategory(
  categoryId: number,
): Promise<{ ok: true; data: ExecutorInCategory[] } | { ok: false; error: string }> {
  try {
    const res = await getExecutorsByCategoryRequest(categoryId);
    const data = res.data;
    const rawList = Array.isArray(data) ? data : data ? [data] : [];
    const list = rawList
      .map(normalizeExecutorInCategory)
      .filter((e): e is ExecutorInCategory => e !== null);
    return { ok: true, data: list };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function changeUserPassword(
  userId: number,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await api.patch(`/users/${userId}/change-password`, { new_password: newPassword });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function updateUserProfile(
  userId: number,
  data: {
    full_name?: string;
    phone?: string;
    office_id?: number;
    category_ids?: number[];
    company_id?: number | null;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const body: {
      full_name?: string;
      phone?: string;
      office_id?: number;
      category_ids?: number[];
      company_id?: number | null;
    } = {};
    if (data.full_name !== undefined) body.full_name = data.full_name.trim();
    if (data.phone !== undefined) body.phone = data.phone;
    if (data.office_id !== undefined) body.office_id = data.office_id;
    if (data.category_ids !== undefined && data.category_ids.length > 0) {
      body.category_ids = data.category_ids;
    }
    if (data.company_id !== undefined) body.company_id = data.company_id;
    await api.put(`/users/${userId}`, body);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function updateUserRole(
  userId: number,
  role: string,
  options?: { category_ids?: number[]; specialty?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const body: { role: string; category_ids?: number[]; specialty?: string } = { role };
    if (options?.category_ids?.length) body.category_ids = options.category_ids;
    if (options?.specialty?.trim()) body.specialty = options.specialty.trim();
    await api.put(`/users/${userId}`, body);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function changeCategoryHead(
  categoryId: number,
  executorId: number,
): Promise<
  | { ok: true; data?: { newHead?: { name: string }; processedTasks?: { message?: string } } }
  | { ok: false; error: string }
> {
  try {
    const res = await api.post<{
      newHead?: { name: string };
      processedTasks?: { message?: string };
    }>(`/service-categories/${categoryId}/change-head`, { newHeadUserId: executorId });
    return { ok: true, data: res.data };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}
