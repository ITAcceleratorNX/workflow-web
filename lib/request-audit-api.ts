import api from "@/lib/api";

/** Запись истории заявки (request_logs). */
export interface RequestHistoryEntry {
  id: number;
  action_type: string;
  action_description: string;
  created_at: string;
  user?: { id: number; full_name: string; role?: string } | null;
}

/** Снимок заявки на момент удаления — как её отдавал API. */
export interface DeletedRequestSnapshot {
  id: number;
  status?: string;
  request_type?: string;
  location?: string;
  location_detail?: string | null;
  created_date?: string;
  rejection_reason?: string | null;
  client?: { id: number; full_name: string; phone?: string } | null;
  office?: { id: number; name: string; city?: string } | null;
  requests?: { id: number; title: string; status: string; description?: string | null }[];
}

/** Запись контрольного журнала удалений. */
export interface RequestDeletionAuditEntry {
  id: number;
  request_group_id: number;
  /** Подзаявка, если удалялась она одна; null — удалена вся заявка. */
  request_id: number | null;
  deleted_by: number;
  deleted_by_name: string | null;
  deleted_by_role: string | null;
  reason: string | null;
  snapshot: DeletedRequestSnapshot;
  history: RequestHistoryEntry[];
  deleted_at: string;
}

interface Page<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Журнал удалений, новые записи первыми — только Руководитель платформы. */
export async function getRequestDeletionAudit(page: number, pageSize = 20): Promise<Page<RequestDeletionAuditEntry>> {
  const { data } = await api.get<Page<RequestDeletionAuditEntry>>("/request-groups/deletion-audit", {
    params: { page, pageSize },
  });
  return data;
}

/** История статусов и действий по заявке, от старых к новым. */
export async function getRequestHistory(requestGroupId: number): Promise<RequestHistoryEntry[]> {
  const { data } = await api.get<{ logs: RequestHistoryEntry[] }>(`/request-logs/request/${requestGroupId}`, {
    params: { page: 1, pageSize: 100 },
  });
  return [...(data.logs ?? [])].reverse();
}
