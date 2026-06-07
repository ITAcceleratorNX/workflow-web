import api, { getOffices as getOfficesRequest, type Office } from "@/lib/api";

export type { Office };

export interface ServiceSubcategory {
  id: number;
  name: string;
  category_id: number;
}

export interface ServiceCategory {
  id: number;
  name: string;
  office_id?: number;
  subcategories?: ServiceSubcategory[];
}

function serviceCategoriesOfficeQuery(officeId?: number): string {
  return officeId != null ? `?office_id=${officeId}` : "";
}

function extractError(error: unknown): string {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    "Ошибка запроса"
  );
}

export async function fetchOffices(): Promise<
  { ok: true; data: Office[] } | { ok: false; error: string }
> {
  try {
    const res = await getOfficesRequest();
    const data = res.data;
    const list = Array.isArray(data) ? data : data ? [data] : [];
    return { ok: true, data: list };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function getServiceCategories(officeId?: number): Promise<
  { ok: true; data: ServiceCategory[] } | { ok: false; error: string }
> {
  try {
    const res = await api.get<ServiceCategory[] | ServiceCategory>(
      `/service-categories${serviceCategoriesOfficeQuery(officeId)}`,
    );
    const data = res.data;
    const list = Array.isArray(data) ? data : data ? [data] : [];
    return { ok: true, data: list };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function createServiceCategory(
  body: { name: string },
  officeId?: number,
): Promise<{ ok: true; data: ServiceCategory } | { ok: false; error: string }> {
  try {
    const res = await api.post<ServiceCategory>(
      `/service-categories${serviceCategoriesOfficeQuery(officeId)}`,
      body,
    );
    return { ok: true, data: res.data };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function updateServiceCategory(
  id: number,
  body: { name: string },
  officeId?: number,
): Promise<{ ok: true; data: ServiceCategory } | { ok: false; error: string }> {
  try {
    const res = await api.put<ServiceCategory>(
      `/service-categories/${id}${serviceCategoriesOfficeQuery(officeId)}`,
      body,
    );
    return { ok: true, data: res.data };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function deleteServiceCategory(
  id: number,
  officeId?: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await api.delete(`/service-categories/${id}${serviceCategoriesOfficeQuery(officeId)}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function createSubcategory(
  body: { name: string; category_id: number },
  officeId?: number,
): Promise<{ ok: true; data: ServiceSubcategory } | { ok: false; error: string }> {
  try {
    const res = await api.post<ServiceSubcategory>(
      `/service-categories/subcategories${serviceCategoriesOfficeQuery(officeId)}`,
      body,
    );
    return { ok: true, data: res.data };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function updateSubcategory(
  id: number,
  body: { name: string },
  officeId?: number,
): Promise<{ ok: true; data: ServiceSubcategory } | { ok: false; error: string }> {
  try {
    const res = await api.put<ServiceSubcategory>(
      `/service-categories/subcategories/${id}${serviceCategoriesOfficeQuery(officeId)}`,
      body,
    );
    return { ok: true, data: res.data };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function deleteSubcategory(
  id: number,
  officeId?: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await api.delete(
      `/service-categories/subcategories/${id}${serviceCategoriesOfficeQuery(officeId)}`,
    );
    return { ok: true };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}
