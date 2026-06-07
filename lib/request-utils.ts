/**
 * Утилиты для заявок: фильтры, сортировка, хелперы карточек.
 * Синхронизировано с workflow-mobile app/(tabs)/requests/index.tsx
 */

import { isLongTermRequestGroup } from '@/constants/requests';
import type { RequestGroup, SubRequest } from '@/lib/types/request';

export interface RequestFilterOptions {
  status?: string;
  type?: string;
  officeId?: string;
  period?: 'all' | 'week' | 'month' | 'year';
}

export function getPrimarySubRequest(request: RequestGroup): SubRequest | undefined {
  return request.requests?.[0];
}

/** category_id с бэкенда или вложенный category.id */
export function getSubRequestCategoryId(
  sub: Pick<SubRequest, 'category_id' | 'category'>,
): number | undefined {
  const id = sub.category_id ?? sub.category?.id;
  return id != null && Number.isFinite(Number(id)) && Number(id) > 0 ? Number(id) : undefined;
}

/** Первое фото: с группы или с первой подзаявки (как в mobile). */
export function getFirstPhotoUrl(request: RequestGroup): string | null {
  const fromGroup = request.photos?.[0]?.photo_url;
  if (fromGroup) return fromGroup;
  const sub = getPrimarySubRequest(request);
  return sub?.photos?.[0]?.photo_url ?? null;
}

export function getExecutorBlockLine(request: RequestGroup): string {
  const sub = getPrimarySubRequest(request);
  return (
    sub?.location?.trim() ||
    request.location_detail?.trim() ||
    request.location?.trim() ||
    'Не указано'
  );
}

export function getExecutorRequestTitle(request: RequestGroup): string {
  const sub = getPrimarySubRequest(request);
  const t = sub?.title?.trim();
  if (t) return t;
  const d = sub?.description?.trim();
  if (d) return d.length > 80 ? `${d.slice(0, 80)}…` : d;
  return 'Не указано';
}

export function matchesRequestStatusFilter(
  request: RequestGroup,
  filterStatus: string
): boolean {
  if (filterStatus === 'all') return true;
  if (filterStatus === 'long_term') {
    return isLongTermRequestGroup(request);
  }
  return request.status === filterStatus;
}

export function matchesRequestTypeFilter(
  request: RequestGroup,
  filterType: string
): boolean {
  if (filterType === 'all') return true;
  return (request.request_type ?? 'normal') === filterType;
}

function getPeriodStartDate(period: RequestFilterOptions['period']): Date | null {
  if (!period || period === 'all') return null;
  const now = new Date();
  switch (period) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case 'year':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    default:
      return null;
  }
}

export function filterRequestGroups(
  requests: RequestGroup[],
  filters: RequestFilterOptions
): RequestGroup[] {
  const status = filters.status ?? 'all';
  const type = filters.type ?? 'all';

  let result = requests.filter(
    (r) => matchesRequestStatusFilter(r, status) && matchesRequestTypeFilter(r, type)
  );

  if (filters.officeId && filters.officeId !== 'all') {
    const officeId = parseInt(filters.officeId, 10);
    if (Number.isFinite(officeId)) {
      result = result.filter((r) => r.office_id === officeId);
    }
  }

  const periodStart = getPeriodStartDate(filters.period);
  if (periodStart) {
    const fromTime = periodStart.getTime();
    result = result.filter((r) => {
      const created = new Date(r.created_date).getTime();
      return !Number.isNaN(created) && created >= fromTime;
    });
  }

  return result;
}

/** Новые заявки выше (как в mobile sortedList). */
export function sortRequestGroupsByCreatedDate(
  requests: RequestGroup[]
): RequestGroup[] {
  return [...requests].sort((a, b) => {
    const da = new Date(a.created_date).getTime();
    const db = new Date(b.created_date).getTime();
    if (Number.isNaN(db)) return 0;
    if (Number.isNaN(da)) return 1;
    return db - da;
  });
}

/** Приоритет: in_progress → urgent → по дате (legacy web sort). */
export function sortRequestGroupsByPriority(
  requests: RequestGroup[]
): RequestGroup[] {
  return [...requests].sort((a, b) => {
    const aInProgress = a.status === 'in_progress';
    const bInProgress = b.status === 'in_progress';
    if (aInProgress !== bInProgress) return aInProgress ? -1 : 1;

    if (a.request_type === 'urgent' && b.request_type !== 'urgent') return -1;
    if (b.request_type === 'urgent' && a.request_type !== 'urgent') return 1;

    const dateA = a.created_date ? new Date(a.created_date).getTime() : 0;
    const dateB = b.created_date ? new Date(b.created_date).getTime() : 0;
    return dateB - dateA;
  });
}

/** @deprecated используйте sortRequestGroupsByPriority */
export const sortRequests = sortRequestGroupsByPriority;
