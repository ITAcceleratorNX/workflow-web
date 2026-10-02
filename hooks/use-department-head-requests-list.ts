"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildRequestsUrlWithoutFilters } from "@/lib/requestNavigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import api, { deleteRecurringTask } from "@/lib/api";
import { listLoadError } from "@/lib/request-list-loading";
import { useRequestListWindow } from "@/hooks/use-request-list-window";
import { useRequestStore } from "@/stores/useRequestStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { useToast } from "@/hooks/use-toast";
import { useRequestSelectionFromUrl } from "@/hooks/useRequestSelectionFromUrl";
import { useRequestBulkDelete } from "@/hooks/use-request-bulk-delete";
import { getStatusOptionsForRole } from "@/constants/requests";
import { filterRequestGroups, sortRequestGroupsByPriority } from "@/lib/request-utils";
import {
  mapExecutorInCategoryToAssignModal,
  type DepartmentHeadExecutor,
  type DepartmentHeadRequestsTab,
} from "@/components/department-head/requests/department-head-requests-constants";
import { getExecutorsForSubRequestAssignment } from "@/lib/users-management-api";

export function useDepartmentHeadRequestsList() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const { token, user } = useAuthStore();
  const { toast } = useToast();
  const { categories, fetchCategories } = useCategoryStore();
  const { incomingRequests, setIncomingRequests, myRequests, setMyRequests } = useRequestStore();

  const [filterMyStatus, setFilterMyStatus] = useState("all");
  const [filterMyType, setFilterMyType] = useState("all");
  const [filterIncomingStatus, setFilterIncomingStatus] = useState("all");
  const [filterIncomingType, setFilterIncomingType] = useState("all");
  const [activeTab, setActiveTab] = useState<DepartmentHeadRequestsTab>("incoming");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchVersion = useRef(0);
  const lastElementRef = useRef<HTMLDivElement | null>(null);

  const [showAssignExecutorsModal, setShowAssignExecutorsModal] = useState(false);
  const [selectedSubRequestForAssignment, setSelectedSubRequestForAssignment] = useState<any>(null);
  const [showChangeExecutorsModal, setShowChangeExecutorsModal] = useState(false);
  const [selectedSubRequestForChange, setSelectedSubRequestForChange] = useState<any>(null);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [selectedRequestForRedirect, setSelectedRequestForRedirect] = useState<any>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectError, setRedirectError] = useState<string | null>(null);
  const [executors, setExecutors] = useState<DepartmentHeadExecutor[]>([]);

  const statusFilterOptions = useMemo(() => getStatusOptionsForRole("department-head"), []);

  const fetchRequests = useCallback(
    async (_page = 1) => {
      const version = ++fetchVersion.current;
      if (!token) { setLoading(false); return; }
      setLoading(true);
      setError(null);
      try {
        // Department endpoint returns the full snapshot. Each tab filters independently.
        const { data } = await api.get("/request-groups");
        if (!Array.isArray(data.otherRequests) || !Array.isArray(data.myRequests)) {
          throw new Error("Invalid request lists");
        }
        if (version !== fetchVersion.current) return;
        setIncomingRequests(sortRequestGroupsByPriority(data.otherRequests));
        setMyRequests(sortRequestGroupsByPriority(data.myRequests));
      } catch (failure) {
        if (version === fetchVersion.current) setError(listLoadError(failure));
      } finally {
        if (version === fetchVersion.current) setLoading(false);
      }
    },
    [token, setIncomingRequests, setMyRequests]
  );

  const subForExecutorList =
    showAssignExecutorsModal && selectedSubRequestForAssignment
      ? selectedSubRequestForAssignment
      : showChangeExecutorsModal && selectedSubRequestForChange
        ? selectedSubRequestForChange
        : null;

  useEffect(() => {
    void fetchRequests();
    return () => { fetchVersion.current += 1; };
  }, [fetchRequests]);

  useEffect(() => {
    if (isDesktop && token) {
      fetchCategories(token);
    }
  }, [isDesktop, token, fetchCategories]);

  useEffect(() => {
    if (!isDesktop || !subForExecutorList) {
      if (!subForExecutorList) setExecutors([]);
      return;
    }
    let cancelled = false;
    const officeId = user?.office_id != null ? Number(user.office_id) : undefined;
    void getExecutorsForSubRequestAssignment(subForExecutorList, officeId).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setExecutors(res.data.map(mapExecutorInCategoryToAssignModal));
      } else {
        setExecutors([]);
        console.error("Ошибка загрузки исполнителей:", res.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isDesktop, subForExecutorList, user?.office_id]);

  const filteredMyRequests = useMemo(
    () =>
      sortRequestGroupsByPriority(
        filterRequestGroups(myRequests, {
          status: filterMyStatus,
          type: filterMyType,
        })
      ),
    [myRequests, filterMyStatus, filterMyType]
  );

  const filteredIncomingRequests = useMemo(
    () =>
      sortRequestGroupsByPriority(
        filterRequestGroups(incomingRequests, {
          status: filterIncomingStatus,
          type: filterIncomingType,
        })
      ),
    [incomingRequests, filterIncomingStatus, filterIncomingType]
  );

  const activeList = useMemo(() => {
    if (activeTab === "incoming") return filteredIncomingRequests;
    if (activeTab === "my-requests") return filteredMyRequests;
    return [];
  }, [activeTab, filteredIncomingRequests, filteredMyRequests]);

  const { visibleRequests, hasMore, loadingMore, handleLoadMore } = useRequestListWindow(
    activeList, `${activeTab}:${filterMyStatus}:${filterMyType}:${filterIncomingStatus}:${filterIncomingType}`,
  );
  const isFiltered = activeTab === "my-requests"
    ? filterMyStatus !== "all" || filterMyType !== "all"
    : filterIncomingStatus !== "all" || filterIncomingType !== "all";
  const resetFilters = () => {
    if (activeTab === "my-requests") { setFilterMyStatus("all"); setFilterMyType("all"); }
    else { setFilterIncomingStatus("all"); setFilterIncomingType("all"); }
    router.replace(buildRequestsUrlWithoutFilters(pathname, searchParams.toString()), { scroll: false });
  };

  const {
    displayRequest,
    selectRequest: handleCardClick,
    closeDetail: handleClosePanel,
    clearAfterUpdate,
  } = useRequestSelectionFromUrl({
    requestsBasePath: "/department-head/requests",
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
    await fetchRequests(1);
  }, [fetchRequests]);

  const handleRequestUpdated = useCallback(() => {
    fetchRequests(1);
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
    [toast]
  );

  const handleAssignExecutors = useCallback((subRequest: any) => {
    setSelectedSubRequestForAssignment(subRequest);
    setShowAssignExecutorsModal(true);
  }, []);

  const closeAssignExecutorsModal = useCallback(() => {
    setShowAssignExecutorsModal(false);
    setSelectedSubRequestForAssignment(null);
  }, []);

  const handleAssignExecutorsSuccess = useCallback(() => {
    toast({
      title: "Исполнители назначены",
      description: "Исполнители успешно назначены на заявку",
    });
    fetchRequests(1);
    closeAssignExecutorsModal();
  }, [toast, fetchRequests, closeAssignExecutorsModal]);

  const handleChangeExecutors = useCallback((subRequest: any) => {
    setSelectedSubRequestForChange(subRequest);
    setShowChangeExecutorsModal(true);
  }, []);

  const closeChangeExecutorsModal = useCallback(() => {
    setShowChangeExecutorsModal(false);
    setSelectedSubRequestForChange(null);
  }, []);

  const handleChangeExecutorsSuccess = useCallback(() => {
    toast({
      title: "Исполнители изменены",
      description: "Исполнители успешно изменены для подзаявки",
    });
    fetchRequests(1);
    closeChangeExecutorsModal();
  }, [toast, fetchRequests, closeChangeExecutorsModal]);

  const handleOpenRedirectModal = useCallback(
    (subRequest: any) => {
      setSelectedRequestForRedirect(
        displayRequest ? { ...subRequest, requestGroup: displayRequest } : subRequest
      );
      setRedirectError(null);
      setSelectedCategoryId(null);
      setShowRedirectModal(true);
    },
    [displayRequest]
  );

  const handleCloseRedirectModal = useCallback(() => {
    setShowRedirectModal(false);
    setSelectedRequestForRedirect(null);
    setSelectedCategoryId(null);
    setRedirectError(null);
  }, []);

  const handleRedirectRequest = useCallback(async () => {
    if (!selectedRequestForRedirect || !selectedCategoryId) return;
    setIsRedirecting(true);
    setRedirectError(null);
    try {
      await api.patch(`/requests/${selectedRequestForRedirect.id}`, {
        status: "awaiting_assignment",
        executor_id: null,
        actual_completion_date: null,
        category_id: selectedCategoryId,
        patch_code: 1,
      });
      const requestGroup = selectedRequestForRedirect.requestGroup || selectedRequestForRedirect;
      const hasOtherSubRequestsWithOurCategory = requestGroup.requests?.some(
        (subReq: any) =>
          subReq.id !== selectedRequestForRedirect.id &&
          subReq.category_id === user?.service_category_id
      );
      if (hasOtherSubRequestsWithOurCategory) {
        await fetchRequests(1);
        toast({ title: "Подзаявка перенаправлена" });
      } else {
        setMyRequests((prev) => prev.filter((req) => req.id !== requestGroup.id));
        setIncomingRequests((prev) => prev.filter((req) => req.id !== requestGroup.id));
        toast({ title: "Заявка перенаправлена" });
      }
      handleCloseRedirectModal();
      clearAfterUpdate();
      router.push("/department-head/requests", { scroll: false });
    } catch (error: any) {
      setRedirectError(error.response?.data?.error || "Не удалось перенаправить заявку");
    } finally {
      setIsRedirecting(false);
    }
  }, [
    selectedRequestForRedirect,
    selectedCategoryId,
    user?.service_category_id,
    fetchRequests,
    handleCloseRedirectModal,
    setMyRequests,
    setIncomingRequests,
    clearAfterUpdate,
    router,
    toast,
  ]);

  return {
    isDesktop,
    activeTab,
    setActiveTab,
    filterMyStatus,
    setFilterMyStatus,
    filterMyType,
    setFilterMyType,
    filterIncomingStatus,
    setFilterIncomingStatus,
    filterIncomingType,
    setFilterIncomingType,
    statusFilterOptions,
    loading,
    loadingMore,
    hasMore,
    activeList: visibleRequests,
    error,
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
    categories,
    executors,
    userServiceCategoryId: user?.service_category_id,
    showAssignExecutorsModal,
    closeAssignExecutorsModal,
    selectedSubRequestForAssignment,
    handleAssignExecutorsSuccess,
    showChangeExecutorsModal,
    closeChangeExecutorsModal,
    selectedSubRequestForChange,
    handleChangeExecutorsSuccess,
    showRedirectModal,
    selectedRequestForRedirect,
    handleCloseRedirectModal,
    handleRedirectRequest,
    selectedCategoryId,
    setSelectedCategoryId,
    isRedirecting,
    redirectError,
    handleAssignExecutors,
    handleChangeExecutors,
    handleOpenRedirectModal,
  };
}

export type UseDepartmentHeadRequestsListResult = ReturnType<typeof useDepartmentHeadRequestsList>;
