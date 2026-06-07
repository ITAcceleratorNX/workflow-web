import api from "@/lib/api";
import type { OfficeLocationCatalogRow } from "@/lib/office-location-catalog-utils";

export type { OfficeLocationCatalogRow };

function extractError(error: unknown): string {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    "Ошибка запроса"
  );
}

export async function getOfficeLocationCatalog(
  officeId: number,
  params?: { includeInactive?: boolean },
): Promise<{ ok: true; data: OfficeLocationCatalogRow[] } | { ok: false; error: string }> {
  try {
    const res = await api.get<{ items: OfficeLocationCatalogRow[] }>(
      `/offices/${officeId}/location-catalog`,
      { params: params?.includeInactive ? { includeInactive: "1" } : undefined },
    );
    const items = res.data?.items;
    return { ok: true, data: Array.isArray(items) ? items : [] };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function createOfficeLocationCatalogRow(
  officeId: number,
  body: {
    block: string;
    floor_zone: string;
    room: string;
    sort_order?: number;
    is_active?: boolean;
  },
): Promise<{ ok: true; data: OfficeLocationCatalogRow } | { ok: false; error: string }> {
  try {
    const res = await api.post<OfficeLocationCatalogRow>(
      `/offices/${officeId}/location-catalog`,
      body,
    );
    return { ok: true, data: res.data };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function updateOfficeLocationCatalogRow(
  officeId: number,
  rowId: number,
  body: Partial<{
    block: string;
    floor_zone: string;
    room: string;
    sort_order: number;
    is_active: boolean;
  }>,
): Promise<{ ok: true; data: OfficeLocationCatalogRow } | { ok: false; error: string }> {
  try {
    const res = await api.patch<OfficeLocationCatalogRow>(
      `/offices/${officeId}/location-catalog/${rowId}`,
      body,
    );
    return { ok: true, data: res.data };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function deleteOfficeLocationCatalogRow(
  officeId: number,
  rowId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await api.delete(`/offices/${officeId}/location-catalog/${rowId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}
