"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildRequestsUrlWithoutFilters } from "@/lib/requestNavigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import api from "@/lib/api";
import { listLoadError } from "@/lib/request-list-loading";
import { useRequestListWindow } from "@/hooks/use-request-list-window";
import { useRequestStore } from "@/stores/useRequestStore";
import type { RequestGroup } from "@/stores/useRequestStore";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { useRequestSelectionFromUrl } from "@/hooks/useRequestSelectionFromUrl";
import { getStatusOptionsForRole } from "@/constants/requests";
import { filterRequestGroups, matchesRequestTypeFilter } from "@/lib/request-utils";
import {
  sortAssignedTasksByType,
  type ExecutorRequestsTab,
} from "@/components/executor/requests/executor-requests-constants";

export function useExecutorRequestsList() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesktop = useIsDesktop();
  const { toast } = useToast();
  const {
    assignedRequests,
    myRequests,
    completedRequests,
    setAssignedRequests,
    setCompletedRequests,
    setMyRequests,
  } = useRequestStore();

  const [activeTab, setActiveTab] = useState<ExecutorRequestsTab>("tasks");
  const [filterType, setFilterType] = useState("all");
  const [filterMyStatus, setFilterMyStatus] = useState("all");
  const [filterMyType, setFilterMyType] = useState("all");
  const [clientRatings, setClientRatings] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchVersion = useRef(0);
  const { token } = useAuthStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [showCompleteTaskModal, setShowCompleteTaskModal] = useState(false);
  const [selectedTaskForComplete, setSelectedTaskForComplete] = useState<any>(null);
  const [isSubmittingComplete, setIsSubmittingComplete] = useState(false);
  const [showRejectSubRequestModal, setShowRejectSubRequestModal] = useState(false);
  const [selectedSubRequestForReject, setSelectedSubRequestForReject] = useState<any>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [selectedRequestForRedirect, setSelectedRequestForRedirect] = useState<any>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  const statusFilterOptions = useMemo(() => getStatusOptionsForRole("executor"), []);

  const fetchRequests = useCallback(
    async (_page = 1) => {
      const version = ++fetchVersion.current;
      if (!token) { setLoading(false); return; }
      setLoading(true);
      setError(null);
      try {
        // Executor endpoint returns all three lists, including per-request ratings.
        const { data } = await api.get("/request-groups");
        if (![data.assignedRequests, data.completedRequests, data.myRequests].every(Array.isArray)) {
          throw new Error("Invalid request lists");
        }
        if (version !== fetchVersion.current) return;
        setAssignedRequests(data.assignedRequests);
        setCompletedRequests(data.completedRequests);
        setMyRequests(data.myRequests);
        const ratings: Record<number, unknown> = {};
        [...data.assignedRequests, ...data.completedRequests, ...data.myRequests].forEach((group) => {
          if (group.clientRatings?.length) ratings[group.id] = group.clientRatings[0];
        });
        setClientRatings(ratings);
      } catch (failure) {
        if (version === fetchVersion.current) setError(listLoadError(failure));
      } finally {
        if (version === fetchVersion.current) setLoading(false);
      }
    },
    [token, setAssignedRequests, setCompletedRequests, setMyRequests]
  );

  useEffect(() => {
    void fetchRequests();
    return () => { fetchVersion.current += 1; };
  }, [fetchRequests]);

  useEffect(() => {
    if (isDesktop && token) fetchCategories(token);
  }, [isDesktop, token, fetchCategories]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    await fetchRequests(1);
  }, [fetchRequests]);

  const filteredMy = useMemo(
    () =>
      filterRequestGroups(myRequests || [], {
        status: filterMyStatus,
        type: filterMyType,
      }),
    [myRequests, filterMyStatus, filterMyType]
  );

  const filteredTasks = useMemo(
    () =>
      sortAssignedTasksByType(
        (assignedRequests || []).filter((t) => matchesRequestTypeFilter(t, filterType))
      ),
    [assignedRequests, filterType]
  );

  const filteredCompleted = useMemo(
    () =>
      (completedRequests || []).filter((t) => matchesRequestTypeFilter(t, filterType)),
    [completedRequests, filterType]
  );

  const activeList = useMemo(() => {
    if (activeTab === "tasks") return filteredTasks;
    if (activeTab === "myTasks") return filteredMy;
    return filteredCompleted;
  }, [activeTab, filteredTasks, filteredMy, filteredCompleted]);

  const { visibleRequests, hasMore, loadingMore, handleLoadMore } = useRequestListWindow(
    activeList, `${activeTab}:${filterType}:${filterMyStatus}:${filterMyType}`,
  );
  const isFiltered = activeTab === "myTasks"
    ? filterMyStatus !== "all" || filterMyType !== "all" : filterType !== "all";
  const resetFilters = () => {
    if (activeTab === "myTasks") { setFilterMyStatus("all"); setFilterMyType("all"); }
    else setFilterType("all");
    router.replace(buildRequestsUrlWithoutFilters(pathname, searchParams.toString()), { scroll: false });
  };

  const {
    displayRequest,
    selectRequest: handleCardClick,
    closeDetail: handleClosePanel,
    clearAfterUpdate,
    setSelectedRequest,
  } = useRequestSelectionFromUrl({
    requestsBasePath: "/executor/requests",
    requestLists: [assignedRequests || [], myRequests || [], completedRequests || []],
    fallbackLists: [filteredTasks, filteredMy, filteredCompleted],
    isDesktop,
    isDataReady: !loading,
  });

  const displayRequestIdRef = useRef<number | null>(null);
  useEffect(() => { displayRequestIdRef.current = displayRequest?.id ?? null; }, [displayRequest?.id]);

  const handleRequestUpdated = useCallback(() => {
    fetchRequests();
    clearAfterUpdate();
  }, [fetchRequests, clearAfterUpdate]);

  const handleStartTask = useCallback(
    async (taskId: string) => {
      try {
        await api.patch(`/requests/${taskId}/execute`);
        toast({ title: "Задача начата" });
        await fetchRequests();
      } catch {
        toast({ title: "Ошибка", variant: "destructive" });
      }
    },
    [fetchRequests, toast]
  );

  const handleCompleteTask = useCallback((task: any) => {
    setSelectedTaskForComplete({
      ...task,
      request_group_id: task.request_group_id ?? displayRequestIdRef.current,
    });
    setShowCompleteTaskModal(true);
  }, []);

  const closeCompleteTaskModal = useCallback(() => {
    setShowCompleteTaskModal(false);
    setSelectedTaskForComplete(null);
  }, []);

  const handleOpenRedirectModal = useCallback((subRequest: any) => {
    setSelectedRequestForRedirect({
      ...subRequest,
      request_group_id: subRequest.request_group_id ?? displayRequestIdRef.current,
    });
    setSelectedCategoryId(null);
    setRedirectError(null);
    setShowRedirectModal(true);
  }, []);

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
      const categoryName = categories.find((c) => c.id === selectedCategoryId)?.name;
      toast({
        title: "Подзаявка перенаправлена",
        description: `Подзаявка успешно перенаправлена руководителям категории "${categoryName}"`,
      });
      handleCloseRedirectModal();
      await fetchRequests();
      const res = await api.get(
        `/request-groups/${selectedRequestForRedirect.request_group_id ?? displayRequestIdRef.current}`
      );
      setSelectedRequest(res.data);
    } catch (err: unknown) {
      console.error("Ошибка при перенаправлении:", err);
      setRedirectError("Не удалось перенаправить подзаявку");
      toast({
        title: "Ошибка",
        description: "Не удалось перенаправить подзаявку",
        variant: "destructive",
      });
    } finally {
      setIsRedirecting(false);
    }
  }, [
    selectedRequestForRedirect,
    selectedCategoryId,
    categories,
    fetchRequests,
    handleCloseRedirectModal,
    toast,
    setSelectedRequest,
  ]);

  const handleRejectSubRequest = useCallback((subRequest: any) => {
    setSelectedSubRequestForReject({
      ...subRequest,
      request_group_id: subRequest.request_group_id ?? displayRequestIdRef.current,
    });
    setRejectError(null);
    setShowRejectSubRequestModal(true);
  }, []);

  const closeRejectSubRequestModal = useCallback(() => {
    setShowRejectSubRequestModal(false);
    setSelectedSubRequestForReject(null);
    setRejectError(null);
  }, []);

  const handleCompleteTaskSubmit = useCallback(
    async (comment: string, photos: File[]) => {
      if (!selectedTaskForComplete) return;
      if (photos.length === 0) {
        toast({
          title: "Ошибка",
          description: "Добавьте хотя бы одну фотографию результата",
          variant: "destructive",
        });
        return;
      }
      setIsSubmittingComplete(true);
      try {
        const response = await api.patch(`/requests/${selectedTaskForComplete.id}/complete`, {
          comment,
        });
        if (photos.length > 0 && response.data?.requestGroup?.id) {
          const formData = new FormData();
          photos.forEach((photo) => formData.append("photos", photo));
          formData.append("type", "after");
          await api.post(`/request-photos/${response.data.requestGroup.id}/photos`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
        closeCompleteTaskModal();
        toast({ title: "Успешно", description: "Заявка успешно завершена" });
        await fetchRequests();
        const groupId = selectedTaskForComplete.request_group_id ?? displayRequestIdRef.current;
        if (groupId) {
          const res = await api.get(`/request-groups/${groupId}`);
          setSelectedRequest(res.data);
        }
      } catch (err) {
        console.error("Ошибка при завершении задачи", err);
        toast({ title: "Ошибка", description: "Не удалось завершить задачу", variant: "destructive" });
      } finally {
        setIsSubmittingComplete(false);
      }
    },
    [selectedTaskForComplete, fetchRequests, toast, closeCompleteTaskModal, setSelectedRequest]
  );

  const handleRejectSubRequestSubmit = useCallback(
    async (reason: string) => {
      if (!selectedSubRequestForReject) return;
      setIsRejecting(true);
      setRejectError(null);
      try {
        await api.put(`/requests/${selectedSubRequestForReject.id}`, {
          status: "awaiting_assignment",
          patch_code: 1,
        });
        await api.post("/notifications/reject-assigned", {
          request_id: selectedSubRequestForReject.id,
          reason,
        });
        closeRejectSubRequestModal();
        toast({
          title: "Подзаявка отклонена",
          description: "Подзаявка успешно отклонена и возвращена в очередь назначения",
        });
        await fetchRequests();
        const groupId =
          selectedSubRequestForReject.request_group_id ?? displayRequestIdRef.current;
        if (groupId) {
          const res = await api.get(`/request-groups/${groupId}`);
          setSelectedRequest(res.data);
        }
      } catch (err: unknown) {
        console.error("Ошибка при отклонении заявки:", err);
        setRejectError("Не удалось отклонить подзаявку");
      } finally {
        setIsRejecting(false);
      }
    },
    [selectedSubRequestForReject, fetchRequests, toast, closeRejectSubRequestModal, setSelectedRequest]
  );

  const getSourceTab = useCallback((): "tasks" | "myTasks" | "completed" => {
    if (activeTab === "tasks") return "tasks";
    if (activeTab === "myTasks") return "myTasks";
    return "completed";
  }, [activeTab]);

  return {
    isDesktop,
    activeTab,
    setActiveTab,
    filterType,
    setFilterType,
    filterMyStatus,
    setFilterMyStatus,
    filterMyType,
    setFilterMyType,
    statusFilterOptions,
    loading,
    loadingMore,
    hasMore,
    clientRatings,
    categories,
    activeList: visibleRequests,
    error,
    isFiltered,
    resetFilters,
    filteredTasks,
    filteredMy,
    filteredCompleted,
    handleRefresh,
    handleLoadMore,
    handleCardClick,
    displayRequest,
    handleClosePanel,
    handleRequestUpdated,
    handleStartTask,
    handleCompleteTask,
    handleRejectSubRequest,
    handleOpenRedirectModal,
    getSourceTab,
    showCompleteTaskModal,
    closeCompleteTaskModal,
    selectedTaskForComplete,
    handleCompleteTaskSubmit,
    isSubmittingComplete,
    showRejectSubRequestModal,
    closeRejectSubRequestModal,
    selectedSubRequestForReject,
    handleRejectSubRequestSubmit,
    isRejecting,
    rejectError,
    showRedirectModal,
    selectedRequestForRedirect,
    handleCloseRedirectModal,
    handleRedirectRequest,
    selectedCategoryId,
    setSelectedCategoryId,
    isRedirecting,
    redirectError,
  };
}

export type UseExecutorRequestsListResult = ReturnType<typeof useExecutorRequestsList>;
