"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { collectRequestPages, listLoadError } from "@/lib/request-list-loading";
import { useRequestListWindow } from "@/hooks/use-request-list-window";
import { buildRequestsUrlWithoutFilters } from "@/lib/requestNavigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import api, { deleteRecurringTask } from "@/lib/api";
import type { RequestGroup } from "@/stores/useRequestStore";
import { useRequestStore } from "@/stores/useRequestStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToast } from "@/hooks/use-toast";
import { useRequestSelectionFromUrl } from "@/hooks/useRequestSelectionFromUrl";
import { useRequestBulkDelete } from "@/hooks/use-request-bulk-delete";
import { getStatusOptionsForRole } from "@/constants/requests";
import {
  filterRequestGroups,
  sortRequestGroupsByCreatedDate,
} from "@/lib/request-utils";
import type { AdminWorkerRequestsTab } from "@/components/admin-worker/requests/admin-worker-requests-constants";

export type AdminWorkerOffice = { id: number; name: string };

export function useAdminWorkerRequestsList() {
  const pathname = usePathname();
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();
  const { toast } = useToast();
  const { incomingRequests, setIncomingRequests, myRequests, setMyRequests } = useRequestStore();

  /** Единые фильтры для всех вкладок — parity с workflow-mobile requests index (admin-worker). */
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterOffice, setFilterOffice] = useState("all");
  const [offices, setOffices] = useState<AdminWorkerOffice[]>([]);

  const [activeTab, setActiveTab] = useState<AdminWorkerRequestsTab>("incoming");
  const [loading, setLoading] = useState(true);
  const fetchVersion = useRef(0);
  const officesVersion = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [officesError, setOfficesError] = useState<string | null>(null);
  const lastElementRef = useRef<HTMLDivElement>(null);

  const statusFilterOptions = useMemo(() => getStatusOptionsForRole("admin-worker"), []);
  const queryStatus = searchParams.get("status");
  const queryType = searchParams.get("priority");
  const queryOffice = searchParams.get("office_id");
  useEffect(() => {
    setFilterStatus(statusFilterOptions.some((option) => option.value === queryStatus) && queryStatus ? queryStatus : "all");
    setFilterType(queryType && ["normal", "urgent", "planned"].includes(queryType) ? queryType : "all");
    setFilterOffice(queryOffice && /^\d+$/.test(queryOffice) ? queryOffice : "all");
  }, [queryStatus, queryType, queryOffice, statusFilterOptions]);

  const fetchOffices = useCallback(async () => {
    const version = ++officesVersion.current;
    if (!token) return;
    setOfficesError(null);
    try {
      const { data } = await api.get<AdminWorkerOffice[]>("/offices");
      if (!Array.isArray(data)) throw new Error("Invalid office list");
      if (version === officesVersion.current) setOffices(data);
    } catch (failure) {
      if (version === officesVersion.current) setOfficesError(`Не удалось загрузить список офисов. ${listLoadError(failure)}`);
    }
  }, [token]);

  useEffect(() => {
    void fetchOffices();
    return () => { officesVersion.current += 1; };
  }, [fetchOffices]);

  const fetchRequests = useCallback(async () => {
    const version = ++fetchVersion.current;
    if (!token) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      // Filter a complete snapshot, so matches are not hidden on later server pages.
      type Item = { id: number; group: RequestGroup; bucket: "incoming" | "my" };
      const list = await collectRequestPages<Item>(async (page) => {
        if (version !== fetchVersion.current) throw new Error("Superseded request");
        const { data } = await api.get<{ otherRequests: RequestGroup[]; myRequests: RequestGroup[]; total: number; pageSize: number }>("/request-groups", { params: { page, pageSize: 50 } });
        if (!Array.isArray(data.otherRequests) || !Array.isArray(data.myRequests)) throw new Error("Invalid request lists");
        return {
          requests: [
            ...data.otherRequests.map((group): Item => ({ id: group.id, group, bucket: "incoming" })),
            ...data.myRequests.map((group): Item => ({ id: group.id, group, bucket: "my" })),
          ],
          totalPages: Math.ceil(data.total / data.pageSize),
        };
      });
      if (version !== fetchVersion.current) return;
      setIncomingRequests(sortRequestGroupsByCreatedDate(list.filter((item) => item.bucket === "incoming").map((item) => item.group)));
      setMyRequests(sortRequestGroupsByCreatedDate(list.filter((item) => item.bucket === "my").map((item) => item.group)));
    } catch (failure) {
      if (version === fetchVersion.current) setError(listLoadError(failure));
    } finally {
      if (version === fetchVersion.current) setLoading(false);
    }
  }, [token, setIncomingRequests, setMyRequests]);

  useEffect(() => {
    void fetchRequests();
    return () => { fetchVersion.current += 1; };
  }, [fetchRequests]);

  const applyFilters = useCallback(
    (requests: typeof incomingRequests) =>
      sortRequestGroupsByCreatedDate(
        filterRequestGroups(requests, {
          status: filterStatus,
          type: filterType,
          officeId: filterOffice,
        }),
      ),
    [filterStatus, filterType, filterOffice],
  );

  const filteredIncomingRequests = useMemo(
    () => applyFilters(incomingRequests),
    [incomingRequests, applyFilters],
  );

  const filteredMyRequests = useMemo(
    () => applyFilters(myRequests),
    [myRequests, applyFilters],
  );

  const activeList = useMemo(() => {
    if (activeTab === "incoming") return filteredIncomingRequests;
    if (activeTab === "my-requests") return filteredMyRequests;
    return [];
  }, [activeTab, filteredIncomingRequests, filteredMyRequests]);

  const { visibleRequests, hasMore, loadingMore, handleLoadMore } = useRequestListWindow(
    activeList, `${activeTab}:${filterStatus}:${filterType}:${filterOffice}`,
  );
  const isFiltered = filterStatus !== "all" || filterType !== "all" || filterOffice !== "all";
  const resetFilters = () => {
    setFilterStatus("all"); setFilterType("all"); setFilterOffice("all");
    router.replace(buildRequestsUrlWithoutFilters(pathname, searchParams.toString()), { scroll: false });
  };

  const {
    displayRequest,
    selectRequest: handleCardClick,
    closeDetail: handleClosePanel,
    clearAfterUpdate,
  } = useRequestSelectionFromUrl({
    requestsBasePath: "/admin-worker/requests",
    requestLists: [incomingRequests, myRequests],
    fallbackLists: [filteredIncomingRequests, filteredMyRequests],
    isDesktop,
    isDataReady: !loading,
  });

  const handleBulkDeleted = useCallback(
    (ids: number[]) => {
      if (displayRequest && ids.includes(displayRequest.id)) handleClosePanel();
    },
    [displayRequest, handleClosePanel],
  );
  const bulkDelete = useRequestBulkDelete(handleBulkDeleted);
  const cancelBulkDelete = bulkDelete.cancel;
  useEffect(() => {
    cancelBulkDelete();
  }, [activeTab, cancelBulkDelete]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchRequests(), fetchOffices()]);
  }, [fetchRequests, fetchOffices]);

  const handleRequestUpdated = useCallback(() => {
    void fetchRequests();
    clearAfterUpdate();
  }, [fetchRequests, clearAfterUpdate]);

  const handleDeleteRecurringTask = useCallback(
    async (id: number) => {
      try {
        await deleteRecurringTask(id);
        toast({ title: "Задача удалена" });
      } catch {
        toast({ title: "Ошибка", variant: "destructive" });
      }
    },
    [toast],
  );

  return {
    isDesktop,
    activeTab,
    setActiveTab,
    filterStatus,
    setFilterStatus,
    filterType,
    setFilterType,
    filterOffice,
    setFilterOffice,
    offices,
    statusFilterOptions,
    loading,
    loadingMore,
    hasMore,
    activeList: visibleRequests,
    error: error ?? officesError,
    isFiltered,
    resetFilters,
    filteredIncomingRequests,
    filteredMyRequests,
    handleRefresh,
    handleLoadMore,
    handleCardClick,
    displayRequest,
    handleClosePanel,
    handleRequestUpdated,
    handleDeleteRecurringTask,
    bulkDelete,
    lastElementRef,
  };
}

export type UseAdminWorkerRequestsListResult = ReturnType<typeof useAdminWorkerRequestsList>;
