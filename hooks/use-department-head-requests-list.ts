"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import api, { deleteRecurringTask } from "@/lib/api";
import { useRequestStore } from "@/stores/useRequestStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { useToast } from "@/hooks/use-toast";
import { useRequestSelectionFromUrl } from "@/hooks/useRequestSelectionFromUrl";
import { getStatusOptionsForRole } from "@/constants/requests";
import { filterRequestGroups, sortRequestGroupsByPriority } from "@/lib/request-utils";
import type { DepartmentHeadRequestsTab } from "@/components/department-head/requests/department-head-requests-constants";
import type { DepartmentHeadExecutor } from "@/components/department-head/requests/department-head-requests-constants";

export function useDepartmentHeadRequestsList() {
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
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
    async (currentPage = 1) => {
      if (!token) return;
      const isFirstPage = currentPage === 1;
      if (isFirstPage) setLoading(true);
      else setLoadingMore(true);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: "10",
        });
        if (filterIncomingStatus !== "all" && filterIncomingStatus !== "long_term") {
          params.append("status", filterIncomingStatus);
        }
        if (filterIncomingType !== "all") {
          params.append("priority", filterIncomingType);
        }

        const response = await api.get(`/request-groups?${params.toString()}`);
        const sortedIncoming = sortRequestGroupsByPriority(response.data.otherRequests || []);
        const sortedMy = sortRequestGroupsByPriority(response.data.myRequests || []);

        setIncomingRequests((prev) =>
          isFirstPage
            ? sortedIncoming
            : [...prev, ...sortedIncoming.filter((i) => !prev.some((p) => p.id === i.id))]
        );
        setMyRequests((prev) =>
          isFirstPage
            ? sortedMy
            : [...prev, ...sortedMy.filter((i) => !prev.some((p) => p.id === i.id))]
        );
        const otherLen = response.data.otherRequests?.length ?? 0;
        const myLen = response.data.myRequests?.length ?? 0;
        setHasMore(otherLen >= 10 || myLen >= 10);
        setPage(currentPage);
      } catch (error) {
        console.error("Ошибка при загрузке заявок:", error);
      } finally {
        if (isFirstPage) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [token, filterIncomingStatus, filterIncomingType, setIncomingRequests, setMyRequests]
  );

  const fetchExecutors = useCallback(async () => {
    try {
      const response = await api.get("/executors");
      setExecutors(response.data || []);
    } catch (error) {
      console.error("Ошибка загрузки исполнителей:", error);
    }
  }, []);

  useEffect(() => {
    fetchRequests(1);
  }, [fetchRequests]);

  useEffect(() => {
    if (isDesktop && token) {
      fetchExecutors();
      fetchCategories(token);
    }
  }, [isDesktop, token, fetchExecutors, fetchCategories]);

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

  const handleRefresh = useCallback(async () => {
    await fetchRequests(1);
  }, [fetchRequests]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchRequests(page + 1);
    }
  }, [loadingMore, hasMore, page, fetchRequests]);

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
    activeList,
    filteredIncomingRequests,
    filteredMyRequests,
    handleRefresh,
    handleLoadMore,
    handleCardClick,
    displayRequest,
    handleClosePanel,
    handleRequestUpdated,
    handleDeleteRecurringTask,
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
