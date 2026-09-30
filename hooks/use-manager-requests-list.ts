"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { collectRequestPages, listLoadError } from "@/lib/request-list-loading";
import { useRequestListWindow } from "@/hooks/use-request-list-window";
import { buildRequestsUrlWithoutFilters, getRequestListPeriod } from "@/lib/requestNavigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import api from "@/lib/api";
import { useRequestStore } from "@/stores/useRequestStore";
import type { RequestGroup } from "@/stores/useRequestStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRequestSelectionFromUrl } from "@/hooks/useRequestSelectionFromUrl";
import { getStatusOptionsForRole } from "@/constants/requests";
import { filterRequestGroups } from "@/lib/request-utils";
import type {
  ManagerOffice,
  ManagerRequestPeriod,
} from "@/components/manager/requests/manager-requests-constants";

export function useManagerRequestsList() {
  const pathname = usePathname();
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();
  const { requests, setRequests } = useRequestStore();

  const [offices, setOffices] = useState<ManagerOffice[]>([]);
  const [office, setOffice] = useState("all");
  const [period, setPeriod] = useState<ManagerRequestPeriod>("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const fetchVersion = useRef(0);
  const officesVersion = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [officesError, setOfficesError] = useState<string | null>(null);
  const lastElementRef = useRef<HTMLDivElement | null>(null);

  const statusFilterOptions = useMemo(() => getStatusOptionsForRole("manager"), []);
  const queryStatus = searchParams.get("status");
  const queryType = searchParams.get("priority");
  const queryOffice = searchParams.get("office_id");
  const queryPeriod = searchParams.get("period");
  useEffect(() => {
    setFilterStatus(statusFilterOptions.some((option) => option.value === queryStatus) && queryStatus ? queryStatus : "all");
    setFilterType(queryType && ["normal", "urgent", "planned"].includes(queryType) ? queryType : "all");
    setOffice(queryOffice && /^\d+$/.test(queryOffice) ? queryOffice : "all");
    setPeriod(getRequestListPeriod(queryPeriod));
  }, [queryStatus, queryType, queryOffice, queryPeriod, statusFilterOptions]);

  const fetchRequests = useCallback(async () => {
    const version = ++fetchVersion.current;
    if (!token) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      // Filter a complete snapshot, so matches are not hidden on later server pages.
      const list = await collectRequestPages<RequestGroup>(async (page) => {
        if (version !== fetchVersion.current) throw new Error("Superseded request");
        const { data } = await api.get<{ data: RequestGroup[]; totalPages: number }>("/request-groups", { params: { page, pageSize: 50 } });
        return { requests: data.data, totalPages: data.totalPages };
      });
      if (version !== fetchVersion.current) return;
      setRequests(list);
    } catch (failure) {
      if (version === fetchVersion.current) setError(listLoadError(failure));
    } finally {
      if (version === fetchVersion.current) setLoading(false);
    }
  }, [token, setRequests]);

  const fetchOffices = useCallback(async () => {
    const version = ++officesVersion.current;
    if (!token) return;
    setOfficesError(null);
    try {
      const { data } = await api.get<ManagerOffice[]>("/offices");
      if (!Array.isArray(data)) throw new Error("Invalid office list");
      if (version === officesVersion.current) setOffices(data);
    } catch (failure) {
      if (version === officesVersion.current) setOfficesError(`Не удалось загрузить список офисов. ${listLoadError(failure)}`);
    }
  }, [token]);

  useEffect(() => {
    void fetchRequests();
    void fetchOffices();
    return () => { fetchVersion.current += 1; officesVersion.current += 1; };
  }, [fetchRequests, fetchOffices]);

  const filteredRequests = useMemo(
    () =>
      filterRequestGroups(requests, {
        status: filterStatus,
        type: filterType,
        officeId: office,
        period,
      }),
    [requests, filterStatus, filterType, office, period]
  );

  const { visibleRequests, hasMore, loadingMore, handleLoadMore } = useRequestListWindow(
    filteredRequests, `${filterStatus}:${filterType}:${office}:${period}`,
  );
  const isFiltered = filterStatus !== "all" || filterType !== "all" || office !== "all" || period !== "all";
  const resetFilters = () => {
    setFilterStatus("all"); setFilterType("all"); setOffice("all"); setPeriod("all");
    router.replace(buildRequestsUrlWithoutFilters(pathname, searchParams.toString()), { scroll: false });
  };

  const {
    displayRequest,
    selectRequest: handleCardClick,
    closeDetail: handleClosePanel,
    clearAfterUpdate,
  } = useRequestSelectionFromUrl({
    requestsBasePath: "/manager/requests",
    requestLists: [requests],
    fallbackLists: [filteredRequests],
    isDesktop,
    isDataReady: !loading,
  });

  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchRequests(), fetchOffices()]);
  }, [fetchRequests, fetchOffices]);

  const handleRequestUpdated = useCallback(() => {
    void fetchRequests();
    clearAfterUpdate();
  }, [fetchRequests, clearAfterUpdate]);

  return {
    isDesktop,
    offices,
    office,
    setOffice,
    period,
    setPeriod,
    filterStatus,
    setFilterStatus,
    filterType,
    setFilterType,
    statusFilterOptions,
    loading,
    loadingMore,
    hasMore,
    filteredRequests: visibleRequests,
    error: error ?? officesError,
    isFiltered,
    resetFilters,
    handleRefresh,
    handleLoadMore,
    handleCardClick,
    displayRequest,
    handleClosePanel,
    handleRequestUpdated,
    lastElementRef,
  };
}

export type UseManagerRequestsListResult = ReturnType<typeof useManagerRequestsList>;
