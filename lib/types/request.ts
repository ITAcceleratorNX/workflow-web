/**
 * Типы заявок — синхронизировано с workflow-mobile/lib/api.ts и stores.
 */

export interface RequestPhoto {
  id: number;
  request_id: number;
  photo_url: string;
  type: string;
  created_at: string;
}

export interface RequestCategory {
  id: number;
  name: string;
}

export interface RequestUser {
  id: number;
  full_name: string;
  phone?: string;
}

export interface RequestExecutorAssignment {
  user: RequestUser;
  RequestExecutor?: { role: string };
}

export interface SubRequestRating {
  rating: number;
  comment?: string;
  comments?: string[];
}

export interface SubRequest {
  id: number;
  title: string;
  description: string;
  status: string;
  category_id?: number;
  category?: RequestCategory;
  complexity?: string;
  sla?: string;
  created_date: string;
  /** @deprecated используйте executors */
  executor?: RequestExecutorAssignment;
  executors?: RequestExecutorAssignment[];
  is_long_term?: boolean;
  ratings?: SubRequestRating[];
  comment?: string;
  rating?: number;
  photos?: RequestPhoto[];
  location?: string;
  actual_completion_date?: string | null;
}

export interface RequestOffice {
  id: number;
  name: string;
  city: string;
  address?: string;
}

export interface RequestClient {
  full_name: string;
  phone?: string;
  role?: string;
}

export interface ClientRating {
  id?: number;
  rating: number;
  comment?: string;
  created_at?: string;
}

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RecurringStatus = 'active' | 'paused' | 'completed';

export interface RequestGroup {
  id: number;
  client_id: number;
  office_id: number;
  location: string;
  location_detail: string;
  date_submitted?: string;
  status: string;
  request_type: string;
  rejection_reason?: string;
  planned_date?: string;
  created_date: string;
  client?: RequestClient;
  office?: RequestOffice;
  photos?: RequestPhoto[];
  requests: SubRequest[];
  is_long_term?: boolean;
  clientRatings?: ClientRating[];
  recurrence_type?: RecurrenceType;
  recurrence_interval?: number;
  next_due_date?: string;
  last_completed_date?: string;
  recurring_status?: RecurringStatus;
}

/** @deprecated используйте RequestGroup */
export type Request = RequestGroup;

export type RequestGroupsBackendResponse =
  | { requests: RequestGroup[]; total: number; totalPages: number; page: number; pageSize: number }
  | { data: RequestGroup[]; total: number; totalPages: number; page: number; pageSize: number }
  | { myRequests: RequestGroup[]; otherRequests: RequestGroup[]; total?: number; page?: number; pageSize?: number }
  | { assignedRequests: RequestGroup[]; completedRequests: RequestGroup[]; myRequests: RequestGroup[] };

export type RequestGroupsSegments = Record<string, RequestGroup[]>;
