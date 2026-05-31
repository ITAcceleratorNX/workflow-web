"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useRequestStore } from "@/stores/useRequestStore";
import { RequestGroup } from "@/stores/useRequestStore";
import { RequestCard } from "@/components/RequestCard";
import { RequestDetails } from "@/components/RequestDetails";
import { AdminManagerRequestsDesktopFrame } from "@/components/layout/AdminManagerRequestsDesktopFrame";
import { ExecutorDesktopShell } from "@/components/layout/ExecutorDesktopShell";
import { CompleteTaskModal } from "@/components/CompleteTaskModal";
import { RejectSubRequestModal } from "@/components/RejectSubRequestModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import PullToRefresh from "@/components/pull-to-refresh";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { useRequestSelectionFromUrl } from "@/hooks/useRequestSelectionFromUrl";

function getTaskTypeOrder(type: string) {
  switch (type) {
    case "urgent":
      return 1;
    case "normal":
      return 2;
    case "planned":
      return 3;
    default:
      return 99;
  }
}

export default function ExecutorRequestsPage() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { toast } = useToast();
  const {
    assignedRequests,
    myRequests,
    completedRequests,
    setAssignedRequests,
    setCompletedRequests,
    setMyRequests,
    clearRequests,
  } = useRequestStore();

  const [activeTab, setActiveTab] = useState<"tasks" | "myTasks" | "completed">("tasks");
  const [filterType, setFilterType] = useState("all");
  const [filterMyStatus, setFilterMyStatus] = useState("all");
  const [filterMyType, setFilterMyType] = useState("all");
  const [clientRatings, setClientRatings] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
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

  const fetchRequests = useCallback(async (pageToLoad = 1) => {
    try {
      const isFirstPage = pageToLoad === 1;
      if (isFirstPage) setLoading(true);
      else setLoadingMore(true);
      const response = await api.get(`request-groups?page=${pageToLoad}&pageSize=10`);
      const responseRating = await api.get("ratings/executor");
      const ratingsMap = new Map<number, any>();
      for (const r of responseRating.data) {
        ratingsMap.set(r.request_id, { rating: parseFloat(r.rating), comments: r.comments || [] });
      }
      const mapCompleted = (list: any[]) =>
        list?.map((reqGroup: any) => ({
          ...reqGroup,
          requests: reqGroup.requests?.map((req: any) => {
            const ratingData = ratingsMap.get(req.id);
            return {
              ...req,
              rating: ratingData?.rating || null,
              ratings: ratingData ? [{ rating: ratingData.rating, comments: ratingData.comments }] : undefined,
            };
          }),
        })) || [];

      const newCompleted = mapCompleted(response.data.completedRequests || []);
      const newAssigned = response.data.assignedRequests || [];
      const newMy = response.data.myRequests || [];

      if (isFirstPage) {
        setCompletedRequests(newCompleted);
        setAssignedRequests(newAssigned);
        setMyRequests(newMy);
      } else {
        setCompletedRequests((prev) => {
          const ids = new Set(prev.map((r: any) => r.id));
          return [...prev, ...newCompleted.filter((r: any) => !ids.has(r.id))];
        });
        setAssignedRequests((prev) => {
          const ids = new Set(prev.map((r: any) => r.id));
          return [...prev, ...newAssigned.filter((r: any) => !ids.has(r.id))];
        });
        setMyRequests((prev) => {
          const ids = new Set(prev.map((r: any) => r.id));
          return [...prev, ...newMy.filter((r: any) => !ids.has(r.id))];
        });
      }
      const newRatings: Record<number, any> = {};
      const allGroups: any[] = [
        ...(response.data.completedRequests || []),
        ...(response.data.assignedRequests || []),
        ...(response.data.myRequests || []),
      ];
      allGroups.forEach((rg: any) => {
        if (rg.clientRatings?.length > 0) {
          const r = rg.clientRatings[0];
          newRatings[rg.id] = { id: r.id, rating: r.rating, comment: r.comment };
        }
      });
      setClientRatings(newRatings);
      const loadedCount =
        (response.data.completedRequests?.length || 0) +
        (response.data.assignedRequests?.length || 0) +
        (response.data.myRequests?.length || 0);
      setHasMore(loadedCount >= 10);
      setPage(pageToLoad);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [setAssignedRequests, setCompletedRequests, setMyRequests]);

  useEffect(() => {
    if (!isDesktop) clearRequests();
    fetchRequests(1);
  }, [isDesktop, fetchRequests, clearRequests]);

  useEffect(() => {
    if (isDesktop && token) fetchCategories(token);
  }, [isDesktop, token, fetchCategories]);

  const handleRefresh = async () => {
    setLoading(true);
    await fetchRequests(1);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchRequests(page + 1);
    }
  };

  const filteredTasks = useMemo(
    () =>
      (assignedRequests || [])
        .filter((t: any) => filterType === "all" || t.request_type === filterType)
        .sort(
          (a: any, b: any) =>
            getTaskTypeOrder(a.request_type || a.type) - getTaskTypeOrder(b.request_type || b.type)
        ),
    [assignedRequests, filterType]
  );

  const filteredMy = useMemo(
    () =>
      (myRequests || []).filter((request: any) => {
        const statusMatch =
          filterMyStatus === "all" ||
          (filterMyStatus === "long_term"
            ? request.requests?.some((req: any) => req.is_long_term && request.request_type !== "recurring")
            : request.status === filterMyStatus);
        const typeMatch = filterMyType === "all" || request.request_type === filterMyType;
        return statusMatch && typeMatch;
      }),
    [myRequests, filterMyStatus, filterMyType]
  );

  const filteredCompleted = useMemo(
    () =>
      (completedRequests || []).filter(
        (t: any) => filterType === "all" || t.request_type === filterType
      ),
    [completedRequests, filterType]
  );

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

  const renderCardHeader = useCallback(
    (requestGroup: RequestGroup) => (
      <div className="pb-3 px-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base leading-tight line-clamp-2 text-gray-900">
              Заявка #{requestGroup.id}
            </h3>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                requestGroup.request_type === "urgent"
                  ? "text-white bg-[#B8400E]"
                  : requestGroup.request_type === "planned"
                    ? "text-white bg-[#114A65]"
                    : "text-white bg-[#114A65]"
              }`}
            >
              {requestGroup.request_type === "urgent"
                ? "Экстренная"
                : requestGroup.request_type === "planned"
                  ? "Плановая"
                  : "Обычная"}
            </span>
          </div>
        </div>
      </div>
    ),
    []
  );

  const handleRequestUpdated = () => {
    fetchRequests();
    clearAfterUpdate();
  };

  const handleStartTask = useCallback(async (taskId: string) => {
    try {
      await api.patch(`/requests/${taskId}/execute`);
      toast({ title: "Задача начата" });
      await fetchRequests();
    } catch {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  }, [fetchRequests, toast]);

  const displayRequestIdRef = React.useRef<number | null>(null);
  displayRequestIdRef.current = displayRequest?.id ?? null;

  const handleCompleteTask = useCallback((task: any) => {
    setSelectedTaskForComplete({
      ...task,
      request_group_id: task.request_group_id ?? displayRequestIdRef.current,
    });
    setShowCompleteTaskModal(true);
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
      const res = await api.get(`/request-groups/${selectedRequestForRedirect.request_group_id ?? displayRequestIdRef.current}`);
      setSelectedRequest(res.data);
    } catch (err: unknown) {
      console.error("Ошибка при перенаправлении:", err);
      setRedirectError("Не удалось перенаправить подзаявку");
      toast({ title: "Ошибка", description: "Не удалось перенаправить подзаявку", variant: "destructive" });
    } finally {
      setIsRedirecting(false);
    }
  }, [selectedRequestForRedirect, selectedCategoryId, categories, fetchRequests, handleCloseRedirectModal, toast]);

  const handleRejectSubRequest = useCallback((subRequest: any) => {
    setSelectedSubRequestForReject({
      ...subRequest,
      request_group_id: subRequest.request_group_id ?? displayRequestIdRef.current,
    });
    setRejectError(null);
    setShowRejectSubRequestModal(true);
  }, []);

  const handleCompleteTaskSubmit = useCallback(async (comment: string, photos: File[]) => {
    if (!selectedTaskForComplete) return;
    if (photos.length === 0) {
      toast({ title: "Ошибка", description: "Добавьте хотя бы одну фотографию результата", variant: "destructive" });
      return;
    }
    setIsSubmittingComplete(true);
    try {
      const response = await api.patch(`/requests/${selectedTaskForComplete.id}/complete`, { comment });
      if (photos.length > 0 && response.data?.requestGroup?.id) {
        const formData = new FormData();
        photos.forEach((photo) => formData.append("photos", photo));
        formData.append("type", "after");
        await api.post(`/request-photos/${response.data.requestGroup.id}/photos`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setShowCompleteTaskModal(false);
      setSelectedTaskForComplete(null);
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
  }, [selectedTaskForComplete, fetchRequests, toast]);

  const handleRejectSubRequestSubmit = useCallback(async (reason: string) => {
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
      setShowRejectSubRequestModal(false);
      setSelectedSubRequestForReject(null);
      toast({ title: "Подзаявка отклонена", description: "Подзаявка успешно отклонена и возвращена в очередь назначения" });
      await fetchRequests();
      const groupId = selectedSubRequestForReject.request_group_id ?? displayRequestIdRef.current;
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
  }, [selectedSubRequestForReject, fetchRequests, toast]);

  if (isDesktop) {
    const desktopList =
      activeTab === "tasks"
        ? filteredTasks
        : activeTab === "myTasks"
          ? filteredMy
          : filteredCompleted;
    const tabsContent = (
      <>
        <button
          type="button"
          onClick={() => setActiveTab("tasks")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "tasks" ? "bg-[#E85D2B] text-white" : "text-white/70 hover:bg-white/10"}`}
        >
          Мои задачи
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("myTasks")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "myTasks" ? "bg-[#E85D2B] text-white" : "text-white/70 hover:bg-white/10"}`}
        >
          Мои заявки
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("completed")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "completed" ? "bg-[#E85D2B] text-white" : "text-white/70 hover:bg-white/10"}`}
        >
          Завершенные
        </button>
      </>
    );

    const filtersContent =
      activeTab === "tasks" ? (
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px] bg-[#2C2C2E] border-white/10 text-white">
            <SelectValue placeholder="Тип" />
          </SelectTrigger>
          <SelectContent className="bg-[#2C2C2E] border-white/10">
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="normal">Обычная</SelectItem>
            <SelectItem value="urgent">Экстренная</SelectItem>
            <SelectItem value="planned">Плановая</SelectItem>
          </SelectContent>
        </Select>
      ) : activeTab === "myTasks" ? (
        <>
          <Select value={filterMyStatus} onValueChange={setFilterMyStatus}>
            <SelectTrigger className="w-[140px] bg-[#2C2C2E] border-white/10 text-white">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent className="bg-[#2C2C2E] border-white/10">
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="in_progress">В обработке</SelectItem>
              <SelectItem value="awaiting_assignment">Ожидает</SelectItem>
              <SelectItem value="execution">Исполнение</SelectItem>
<SelectItem value="completed">Завершено</SelectItem>
              <SelectItem value="overdue">Просрочено</SelectItem>
              <SelectItem value="long_term">Долгосрочные</SelectItem>
              <SelectItem value="rejected">Отклонено</SelectItem>
          </SelectContent>
          </Select>
          <Select value={filterMyType} onValueChange={setFilterMyType}>
            <SelectTrigger className="w-[140px] bg-[#2C2C2E] border-white/10 text-white">
              <SelectValue placeholder="Тип" />
            </SelectTrigger>
            <SelectContent className="bg-[#2C2C2E] border-white/10">
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="normal">Обычная</SelectItem>
              <SelectItem value="urgent">Экстренная</SelectItem>
              <SelectItem value="planned">Плановая</SelectItem>
            </SelectContent>
          </Select>
        </>
      ) : (
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px] bg-[#2C2C2E] border-white/10 text-white">
            <SelectValue placeholder="Тип" />
          </SelectTrigger>
          <SelectContent className="bg-[#2C2C2E] border-white/10">
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="normal">Обычная</SelectItem>
            <SelectItem value="urgent">Экстренная</SelectItem>
            <SelectItem value="planned">Плановая</SelectItem>
          </SelectContent>
        </Select>
      );

    const listContent = (
      <>
        {loading ? (
          <div className="text-center py-12 text-white/60">Загрузка...</div>
        ) : (
          desktopList.map((request: any, index: number) => (
            <RequestCard
              key={request.id || index}
              request={request}
              onCardClick={() => handleCardClick(request)}
              renderCardHeader={renderCardHeader}
              clientRating={clientRatings[request.id]}
              userRole="executor"
              variant="compact"
            />
          ))
        )}
        {!loading && desktopList.length === 0 && (
          <div className="text-center py-12 text-white/60">
            {activeTab === "tasks" ? "Нет назначенных задач" : activeTab === "myTasks" ? "У вас пока нет заявок" : "Нет завершенных задач"}
          </div>
        )}
      </>
    );

    return (
      <ExecutorDesktopShell>
      <div className="client-desktop-content h-full">
      <AdminManagerRequestsDesktopFrame
        filtersSlot={filtersContent}
        tabsSlot={tabsContent}
        listSlot={listContent}
        detailSlot={
          displayRequest ? (
            <RequestDetails
              request={displayRequest}
              onClose={handleClosePanel}
              onRequestUpdated={handleRequestUpdated}
              sourceTab={activeTab === "tasks" ? "tasks" : activeTab === "myTasks" ? "myTasks" : "completed"}
              hideFullModeButton
              userRole="executor"
              fullModeRedirectBase="/executor"
              onStartTask={handleStartTask}
              onCompleteTask={handleCompleteTask}
              onReject={handleRejectSubRequest}
              onRedirectToOtherDepartment={handleOpenRedirectModal}
              embedInPanel
            />
          ) : null
        }
        displayRequestId={displayRequest?.id}
        onCloseDetail={handleClosePanel}
      />
      </div>
      <CompleteTaskModal
        isOpen={showCompleteTaskModal}
        onClose={() => {
          setShowCompleteTaskModal(false);
          setSelectedTaskForComplete(null);
        }}
        onComplete={handleCompleteTaskSubmit}
        task={selectedTaskForComplete}
        isSubmitting={isSubmittingComplete}
      />
      <RejectSubRequestModal
        isOpen={showRejectSubRequestModal}
        onClose={() => {
          setShowRejectSubRequestModal(false);
          setSelectedSubRequestForReject(null);
          setRejectError(null);
        }}
        onReject={handleRejectSubRequestSubmit}
        request={selectedSubRequestForReject}
        isSubmitting={isRejecting}
        error={rejectError}
      />
      {showRedirectModal &&
        selectedRequestForRedirect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50"
            onClick={(e) => e.target === e.currentTarget && handleCloseRedirectModal()}
          >
            <Card className="w-full max-w-md bg-[#2C2C2E] border border-white/10 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle className="text-white">Перенаправить к другой категории</CardTitle>
                <CardDescription className="text-white/70">
                  Выберите категорию, к которой нужно перенаправить подзаявку
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="category" className="text-white">Категория</Label>
                  <Select
                    value={selectedCategoryId?.toString() ?? ""}
                    onValueChange={(value) => setSelectedCategoryId(parseInt(value))}
                  >
                    <SelectTrigger className="bg-[#1A1A1A] border-white/10 text-white">
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent className="z-[100001] bg-[#2C2C2E] border-white/10">
                      {categories
                        .filter((c) => c.id !== selectedRequestForRedirect.category_id)
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()} className="text-white">
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedCategoryId && (
                  <div className="bg-[#E85D2B]/20 border border-[#E85D2B]/40 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-[#E85D2B] flex-shrink-0" />
                      <span className="text-sm text-white/90">
                        Подзаявка будет перенаправлена руководителям категории &quot;{categories.find((c) => c.id === selectedCategoryId)?.name}&quot;
                      </span>
                    </div>
                  </div>
                )}
                {redirectError && <p className="text-sm text-red-400">{redirectError}</p>}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCloseRedirectModal}
                    className="!bg-transparent border border-white/30 !text-white hover:!bg-white/10"
                  >
                    Отмена
                  </Button>
                  <Button
                    onClick={handleRedirectRequest}
                    disabled={!selectedCategoryId || isRedirecting}
                    className="bg-[#E85D2B] hover:bg-[#D94F15] text-white"
                  >
                    {isRedirecting ? "Перенаправление..." : "Перенаправить"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>,
          document.body
        )}
      </ExecutorDesktopShell>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">Заявки</h1>
        <Link href="/create-request">
          <Button className="h-12 px-5 bg-[#E25B21] hover:bg-[#D94F15] text-white font-semibold rounded-2xl">
            <Plus className="h-4 w-4 mr-2" />
            Создать
          </Button>
        </Link>
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-4">
          <div className="flex rounded-xl overflow-hidden bg-[#3D3D3D]">
            <button
              type="button"
              onClick={() => setActiveTab("tasks")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 ${
                activeTab === "tasks" ? "bg-[#5A5A5A] text-white" : "bg-transparent text-gray-400"
              }`}
            >
              Мои задачи
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("myTasks")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 ${
                activeTab === "myTasks" ? "bg-[#5A5A5A] text-white" : "bg-transparent text-gray-400"
              }`}
            >
              Мои заявки
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("completed")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 ${
                activeTab === "completed" ? "bg-[#5A5A5A] text-white" : "bg-transparent text-gray-400"
              }`}
            >
              Завершенные
            </button>
          </div>

          {activeTab === "tasks" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Мои задачи</h2>
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="flex-1 bg-[#2C2C2E] border-[#3A3A3C] text-white">
                    <SelectValue placeholder="Тип" />
                  </SelectTrigger>
                  <SelectContent className="z-[110] bg-[#2C2C2E] border-[#3A3A3C]">
                    <SelectItem value="all" className="text-white">Все</SelectItem>
                    <SelectItem value="normal" className="text-white">Обычная</SelectItem>
                    <SelectItem value="urgent" className="text-white">Экстренная</SelectItem>
                    <SelectItem value="planned" className="text-white">Плановая</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4 pb-40">
                {loading ? (
                  <div className="text-center py-8 text-gray-400">Загрузка...</div>
                ) : (
                  filteredTasks.map((request: any, index: number) => (
                    <RequestCard
                      key={request.id || index}
                      request={request}
                      onCardClick={() => handleCardClick(request)}
                      renderCardHeader={renderCardHeader}
                      clientRating={clientRatings[request.id]}
                      userRole="executor"
                      variant="compact"
                    />
                  ))
                )}
                {!loading && filteredTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-400">Нет назначенных задач</div>
                )}
              </div>
            </div>
          )}

          {activeTab === "myTasks" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Мои заявки</h2>
              <div className="flex gap-2">
                <Select value={filterMyStatus} onValueChange={setFilterMyStatus}>
                  <SelectTrigger className="flex-1 bg-[#2C2C2E] border-[#3A3A3C] text-white">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent className="z-[110] bg-[#2C2C2E] border-[#3A3A3C]">
                    <SelectItem value="all" className="text-white">Все</SelectItem>
                    <SelectItem value="in_progress" className="text-white">В обработке</SelectItem>
                    <SelectItem value="awaiting_assignment" className="text-white">Ожидает</SelectItem>
                    <SelectItem value="execution" className="text-white">Исполнение</SelectItem>
<SelectItem value="completed" className="text-white">Завершено</SelectItem>
                    <SelectItem value="overdue" className="text-white">Просрочено</SelectItem>
                    <SelectItem value="long_term" className="text-white">Долгосрочные</SelectItem>
                    <SelectItem value="rejected" className="text-white">Отклонено</SelectItem>
                </SelectContent>
                </Select>
                <Select value={filterMyType} onValueChange={setFilterMyType}>
                  <SelectTrigger className="flex-1 bg-[#2C2C2E] border-[#3A3A3C] text-white">
                    <SelectValue placeholder="Тип" />
                  </SelectTrigger>
                  <SelectContent className="z-[110] bg-[#2C2C2E] border-[#3A3A3C]">
                    <SelectItem value="all" className="text-white">Все</SelectItem>
                    <SelectItem value="normal" className="text-white">Обычная</SelectItem>
                    <SelectItem value="urgent" className="text-white">Экстренная</SelectItem>
                    <SelectItem value="planned" className="text-white">Плановая</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4 pb-40">
                {loading ? (
                  <div className="text-center py-8 text-gray-400">Загрузка...</div>
                ) : (
                  filteredMy.map((request: any, index: number) => (
                    <RequestCard
                      key={request.id || index}
                      request={request}
                      onCardClick={() => handleCardClick(request)}
                      renderCardHeader={renderCardHeader}
                      clientRating={clientRatings[request.id]}
                      userRole="executor"
                      variant="compact"
                    />
                  ))
                )}
                {!loading && filteredMy.length === 0 && (
                  <div className="text-center py-8 text-gray-400">У вас пока нет заявок</div>
                )}
              </div>
            </div>
          )}

          {activeTab === "completed" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Завершенные</h2>
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="flex-1 bg-[#2C2C2E] border-[#3A3A3C] text-white">
                    <SelectValue placeholder="Тип" />
                  </SelectTrigger>
                  <SelectContent className="z-[110] bg-[#2C2C2E] border-[#3A3A3C]">
                    <SelectItem value="all" className="text-white">Все</SelectItem>
                    <SelectItem value="normal" className="text-white">Обычная</SelectItem>
                    <SelectItem value="urgent" className="text-white">Экстренная</SelectItem>
                    <SelectItem value="planned" className="text-white">Плановая</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4 pb-40">
                {loading ? (
                  <div className="text-center py-8 text-gray-400">Загрузка...</div>
                ) : (
                  filteredCompleted.map((request: any, index: number) => (
                    <RequestCard
                      key={request.id || index}
                      request={request}
                      onCardClick={() => handleCardClick(request)}
                      renderCardHeader={renderCardHeader}
                      clientRating={clientRatings[request.id]}
                      userRole="executor"
                      variant="compact"
                    />
                  ))
                )}
                {!loading && filteredCompleted.length === 0 && (
                  <div className="text-center py-8 text-gray-400">Нет завершенных задач</div>
                )}
              </div>
            </div>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}
