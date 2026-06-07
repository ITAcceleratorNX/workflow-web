import api from "@/lib/api";

function extractError(error: unknown): string {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    "Ошибка запроса"
  );
}

export interface RegistrationRequestItem {
  id: number;
  phone: string;
  full_name: string;
  office_id?: number;
  office: { id?: number; name: string };
  role: string;
  service_category_id?: number;
  service_category?: { name: string };
  company_id?: number | null;
  company?: { id: number; name: string } | null;
  company_other_name?: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface RegistrationRequestsListMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getRegistrationRequests(filters?: {
  status?: string;
  office_id?: string;
  date_from?: string;
  date_to?: string;
  page?: string;
  page_size?: string;
}): Promise<
  | { ok: true; data: RegistrationRequestItem[]; meta: RegistrationRequestsListMeta }
  | { ok: false; error: string }
> {
  try {
    const params: Record<string, string> = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.office_id) params.office_id = filters.office_id;
    if (filters?.date_from) params.date_from = filters.date_from;
    if (filters?.date_to) params.date_to = filters.date_to;
    if (filters?.page) params.page = filters.page;
    if (filters?.page_size) params.page_size = filters.page_size;

    const res = await api.get<{
      success?: boolean;
      data?: RegistrationRequestItem[];
      meta?: RegistrationRequestsListMeta;
    }>("/registration-requests", { params });

    const raw = res.data;
    const list = Array.isArray(raw?.data) ? raw.data : [];
    const meta = raw?.meta;
    const pageSize =
      meta?.pageSize != null && Number.isFinite(meta.pageSize) ? meta.pageSize : 20;
    const total = meta?.total != null && Number.isFinite(meta.total) ? meta.total : list.length;
    const page = meta?.page != null && Number.isFinite(meta.page) ? meta.page : 1;
    const totalPages =
      meta?.totalPages != null && Number.isFinite(meta.totalPages) && meta.totalPages > 0
        ? meta.totalPages
        : Math.max(1, Math.ceil(total / (pageSize || 1)));

    return {
      ok: true,
      data: list,
      meta: { total, page, pageSize, totalPages },
    };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function approveRegistrationRequest(
  requestId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await api.put(`/registration-requests/${requestId}/approve`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function rejectRegistrationRequest(
  requestId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await api.put(`/registration-requests/${requestId}/reject`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function deleteRejectedRegistrationRequest(
  requestId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await api.delete(`/registration-requests/${requestId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function updateRegistrationRequest(
  requestId: number,
  body: {
    office_id?: number;
    company_id?: number | null;
    company_other_name?: string | null;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await api.put(`/registration-requests/${requestId}`, body);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}
