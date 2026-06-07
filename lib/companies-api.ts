import api, { type Company } from "@/lib/api";
import { fetchOffices } from "@/lib/service-categories-api";

export type { Company };
export { fetchOffices };

function extractError(error: unknown): string {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    "Ошибка запроса"
  );
}

export async function getOfficeCompanies(
  officeId: number,
): Promise<{ ok: true; data: Company[] } | { ok: false; error: string }> {
  try {
    const res = await api.get<{ items: Company[] }>(`/offices/${officeId}/companies`);
    const items = res.data?.items;
    return { ok: true, data: Array.isArray(items) ? items : [] };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function createOfficeCompany(
  officeId: number,
  body: { name: string },
): Promise<{ ok: true; data: Company } | { ok: false; error: string }> {
  try {
    const res = await api.post<Company>(`/offices/${officeId}/companies`, body);
    return { ok: true, data: res.data };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function updateOfficeCompany(
  officeId: number,
  companyId: number,
  body: { name: string },
): Promise<{ ok: true; data: Company } | { ok: false; error: string }> {
  try {
    const res = await api.patch<Company>(
      `/offices/${officeId}/companies/${companyId}`,
      body,
    );
    return { ok: true, data: res.data };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function deleteOfficeCompany(
  officeId: number,
  companyId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await api.delete(`/offices/${officeId}/companies/${companyId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}
