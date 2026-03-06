"use client";

import React, { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, AlertTriangle } from "lucide-react";
import { sortRequests, useRequestStore } from "@/stores/useRequestStore";
import { RequestGroup } from "@/stores/useRequestStore";
import { RequestCard } from "@/components/RequestCard";
import { RecurringTasksList } from "@/components/recurring-tasks";
import PullToRefresh from "@/components/pull-to-refresh";
import api, { deleteRecurringTask } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { useToast } from "@/hooks/use-toast";
import { RequestDetails } from "@/components/RequestDetails";
import { AdminManagerRequestsDesktopFrame } from "@/components/layout/AdminManagerRequestsDesktopFrame";
import { AssignExecutorsModal } from "@/components/AssignExecutorsModal";
import { ChangeExecutorsModal } from "@/components/ChangeExecutorsModal";

interface Executor {
  id: number;
  executor_id: number;
  user: { id: number; full_name: string; phone?: string; role: string };
  specialty: string;
  rating: number;
  workload: number;
}

export default function DepartmentHeadRequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { token, user } = useAuthStore();
  const { toast } = useToast();
  const { categories, fetchCategories } = useCategoryStore();
  const requestIdFromUrl = searchParams?.get("requestId");

  const {
    incomingRequests,
    setIncomingRequests,
    myRequests,
    setMyRequests,
  } = useRequestStore();

  const [filterMyStatus, setFilterMyStatus] = useState("all");
  const [filterMyType, setFilterMyType] = useState("all");
  const [filterIncomingStatus, setFilterIncomingStatus] = useState("all");
  const [filterIncomingType, setFilterIncomingType] = useState("all");
  const [activeTab, setActiveTab] = useState<"incoming" | "my-requests" | "recurring">("incoming");
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const lastElementRef = useRef<HTMLDivElement | null>(null);

  // Модалки для desktop: назначить исполнителя, изменить, перенаправить
  const [showAssignExecutorsModal, setShowAssignExecutorsModal] = useState(false);
  const [selectedSubRequestForAssignment, setSelectedSubRequestForAssignment] = useState<any>(null);
  const [showChangeExecutorsModal, setShowChangeExecutorsModal] = useState(false);
  const [selectedSubRequestForChange, setSelectedSubRequestForChange] = useState<any>(null);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [selectedRequestForRedirect, setSelectedRequestForRedirect] = useState<any>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectError, setRedirectError] = useState<string | null>(null);
  const [executors, setExecutors] = useState<Executor[]>([]);

  const fetchRequests = useCallback(
    async (currentPage = 1) => {
      if (!token) return;
      setLoading(true);
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
        const sortedIncoming = sortRequests(response.data.otherRequests || []);
        const sortedMy = sortRequests(response.data.myRequests || []);

        setIncomingRequests((prev) =>
          currentPage === 1 ? sortedIncoming : [...prev, ...sortedIncoming.filter((i) => !prev.some((p) => p.id === i.id))]
        );
        setMyRequests((prev) =>
          currentPage === 1 ? sortedMy : [...prev, ...sortedMy.filter((i) => !prev.some((p) => p.id === i.id))]
        );
        setHasMore((response.data.otherRequests?.length || 0) + (response.data.myRequests?.length || 0) >= 10);
        setPage(currentPage);
      } catch (error) {
        console.error("Ошибка при загрузке заявок:", error);
      } finally {
        setLoading(false);
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
  }, []);

  useEffect(() => {
    fetchRequests(1);
  }, [filterIncomingStatus, filterIncomingType]);

  useEffect(() => {
    if (isDesktop && token) {
      fetchExecutors();
      fetchCategories(token);
    }
  }, [isDesktop, token, fetchExecutors, fetchCategories]);

  const filteredMyRequests = useMemo(
    () =>
      sortRequests(
        myRequests.filter((r) => {
          const statusMatch =
            filterMyStatus === "all" ||
            (filterMyStatus === "long_term" ? r.requests.some((req) => req.is_long_term) : r.status === filterMyStatus);
          const typeMatch = filterMyType === "all" || r.request_type === filterMyType;
          return statusMatch && typeMatch;
        })
      ),
    [myRequests, filterMyStatus, filterMyType]
  );

  const filteredIncomingRequests = useMemo(
    () =>
      sortRequests(
        incomingRequests.filter((r) => {
          const statusMatch =
            filterIncomingStatus === "all" ||
            (filterIncomingStatus === "long_term"
              ? r.requests.some((req) => req.is_long_term)
              : r.status === filterIncomingStatus);
          const typeMatch = filterIncomingType === "all" || r.request_type === filterIncomingType;
          return statusMatch && typeMatch;
        })
      ),
    [incomingRequests, filterIncomingStatus, filterIncomingType]
  );

  const handleRefresh = async () => {
    await fetchRequests(1);
  };

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
              {requestGroup.request_type === "urgent" ? "Экстренная" : requestGroup.request_type === "planned" ? "Плановая" : "Обычная"}
            </span>
          </div>
        </div>
      </div>
    ),
    []
  );

  const [selectedRequest, setSelectedRequest] = useState<RequestGroup | null>(null);
  const [selectedRequestData, setSelectedRequestData] = useState<RequestGroup | null>(null);

  useEffect(() => {
    if (requestIdFromUrl && (incomingRequests.length > 0 || myRequests.length > 0)) {
      const all = [...incomingRequests, ...myRequests];
      const found = all.find((r) => String(r.id) === requestIdFromUrl);
      if (found) setSelectedRequestData(found);
      else setSelectedRequestData(null);
    } else {
      setSelectedRequestData(selectedRequest);
    }
  }, [requestIdFromUrl, incomingRequests, myRequests, selectedRequest]);

  const handleCardClick = (request: RequestGroup) => {
    if (isDesktop) {
      setSelectedRequest(request);
      router.push(`/department-head/requests?requestId=${request.id}`, { scroll: false });
    } else {
      router.push(`/department-head/requests/${request.id}`);
    }
  };

  const handleMyCardClick = (request: RequestGroup) => {
    if (isDesktop) {
      setSelectedRequest(request);
      router.push(`/department-head/requests?requestId=${request.id}`, { scroll: false });
    } else {
      router.push(`/department-head/requests/${request.id}`);
    }
  };

  const handleClosePanel = () => {
    setSelectedRequest(null);
    setSelectedRequestData(null);
    router.push("/department-head/requests", { scroll: false });
  };

  const handleRequestUpdated = () => {
    fetchRequests(1);
    setSelectedRequest(null);
    setSelectedRequestData(null);
    router.push("/department-head/requests", { scroll: false });
  };

  const handleAssignExecutors = (subRequest: any) => {
    setSelectedSubRequestForAssignment(subRequest);
    setShowAssignExecutorsModal(true);
  };

  const handleCloseAssignExecutorsModal = () => {
    setShowAssignExecutorsModal(false);
    setSelectedSubRequestForAssignment(null);
  };

  const handleAssignExecutorsSuccess = () => {
    toast({ title: "Исполнители назначены", description: "Исполнители успешно назначены на заявку" });
    fetchRequests(1);
    handleCloseAssignExecutorsModal();
  };

  const handleChangeExecutors = (subRequest: any) => {
    setSelectedSubRequestForChange(subRequest);
    setShowChangeExecutorsModal(true);
  };

  const handleCloseChangeExecutorsModal = () => {
    setShowChangeExecutorsModal(false);
    setSelectedSubRequestForChange(null);
  };

  const handleChangeExecutorsSuccess = () => {
    toast({ title: "Исполнители изменены", description: "Исполнители успешно изменены для подзаявки" });
    fetchRequests(1);
    handleCloseChangeExecutorsModal();
  };

  const handleOpenRedirectModal = (subRequest: any) => {
    setSelectedRequestForRedirect(subRequest);
    setRedirectError(null);
    setSelectedCategoryId(null);
    setShowRedirectModal(true);
  };

  const handleCloseRedirectModal = () => {
    setShowRedirectModal(false);
    setSelectedRequestForRedirect(null);
    setSelectedCategoryId(null);
    setRedirectError(null);
  };

  const handleRedirectRequest = async () => {
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
        fetchRequests(1);
        toast({ title: "Подзаявка перенаправлена" });
      } else {
        setMyRequests((prev) => prev.filter((req) => req.id !== requestGroup.id));
        setIncomingRequests((prev) => prev.filter((req) => req.id !== requestGroup.id));
        toast({ title: "Заявка перенаправлена" });
      }
      handleCloseRedirectModal();
      setSelectedRequest(null);
      setSelectedRequestData(null);
      router.push("/department-head/requests", { scroll: false });
    } catch (error: any) {
      setRedirectError(error.response?.data?.error || "Не удалось перенаправить заявку");
    } finally {
      setIsRedirecting(false);
    }
  };

  if (isDesktop) {
    const desktopRequests =
      activeTab === "incoming"
        ? filteredIncomingRequests
        : activeTab === "my-requests"
          ? filteredMyRequests
          : [];
    const displayRequest =
      selectedRequestData ??
      (requestIdFromUrl
        ? [...filteredIncomingRequests, ...filteredMyRequests].find((r) => String(r.id) === requestIdFromUrl)
        : null);

    const filtersContent = (
      <>
        <Select value={filterIncomingStatus} onValueChange={setFilterIncomingStatus}>
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
            <SelectItem value="rejected">Отклонено</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterIncomingType} onValueChange={setFilterIncomingType}>
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
    );

    const tabsContent = (
      <>
        <button
          onClick={() => setActiveTab("incoming")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "incoming" ? "bg-[#E85D2B] text-white" : "text-white/70 hover:bg-white/10"}`}
        >
          Входящие
        </button>
        <button
          onClick={() => setActiveTab("my-requests")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "my-requests" ? "bg-[#E85D2B] text-white" : "text-white/70 hover:bg-white/10"}`}
        >
          Мои
        </button>
        <button
          onClick={() => setActiveTab("recurring")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "recurring" ? "bg-[#E85D2B] text-white" : "text-white/70 hover:bg-white/10"}`}
        >
          Повторяющиеся
        </button>
      </>
    );

    const listContent = (
      <>
        {loading ? (
          <div className="text-center py-12 text-white/60">Загрузка...</div>
        ) : activeTab === "recurring" ? (
          <RecurringTasksList
            userRole="department-head"
            isDesktop={true}
            onShowMap={() => {}}
            onDeleteTask={async (id) => {
              try {
                await deleteRecurringTask(id);
                toast({ title: "Задача удалена" });
              } catch {
                toast({ title: "Ошибка", variant: "destructive" });
              }
            }}
          />
        ) : (
          desktopRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onCardClick={activeTab === "incoming" ? handleCardClick : handleMyCardClick}
              renderCardHeader={renderCardHeader}
              userRole="department-head"
              variant="compact"
            />
          ))
        )}
        {!loading && activeTab !== "recurring" && desktopRequests.length === 0 && (
          <div className="text-center py-12 text-white/60">Нет заявок</div>
        )}
      </>
    );

    return (
      <>
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
                userRole="department-head"
                sourceTab="incoming"
                hideFullModeButton
                embedInPanel
                onAssignExecutor={handleAssignExecutors}
                onChangeExecutors={handleChangeExecutors}
                onRedirectToOtherDepartment={handleOpenRedirectModal}
              />
            ) : null
          }
          displayRequestId={displayRequest?.id}
          onCloseDetail={handleClosePanel}
        />
        <AssignExecutorsModal
          isOpen={showAssignExecutorsModal}
          onClose={handleCloseAssignExecutorsModal}
          subRequest={selectedSubRequestForAssignment}
          executors={executors}
          userServiceCategoryId={user?.service_category_id}
          onSuccess={handleAssignExecutorsSuccess}
          variant="dark"
        />
        <ChangeExecutorsModal
          isOpen={showChangeExecutorsModal}
          onClose={handleCloseChangeExecutorsModal}
          subRequest={selectedSubRequestForChange}
          executors={executors}
          userServiceCategoryId={user?.service_category_id}
          onSuccess={handleChangeExecutorsSuccess}
          variant="dark"
        />
        {showRedirectModal && selectedRequestForRedirect && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100]">
            <Card className="w-full max-w-md bg-[#1C1C1E] border border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Перенаправить заявку #{selectedRequestForRedirect.id}</CardTitle>
                <CardDescription className="text-gray-400">
                  Выберите категорию, к которой нужно перенаправить заявку
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-300">Категория</Label>
                  <Select
                    value={selectedCategoryId?.toString() || ""}
                    onValueChange={(value) => setSelectedCategoryId(parseInt(value))}
                  >
                    <SelectTrigger className="bg-[#2C2C2E] border-white/10 text-white">
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2C2C2E] border-white/10 z-[110]">
                      {categories
                        .filter((c) => c.id !== selectedRequestForRedirect.category_id)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()} className="text-white focus:bg-[#F35713]/20">
                            {c.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-[#F35713]/10 border border-[#F35713]/30 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-[#F35713]" />
                    <span className="text-sm text-gray-300">
                      Подзаявка будет перенаправлена руководителям выбранной категории
                    </span>
                  </div>
                </div>
                {redirectError && <p className="text-sm text-red-400">{redirectError}</p>}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCloseRedirectModal} className="bg-transparent text-white hover:bg-white/10">
                    Отмена
                  </Button>
                  <Button
                    onClick={handleRedirectRequest}
                    disabled={!selectedCategoryId || isRedirecting}
                    className="bg-[#F35713] hover:bg-[#E04A0A] text-white"
                  >
                    {isRedirecting ? "Перенаправление..." : "Перенаправить"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </>
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
              onClick={() => setActiveTab("incoming")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 ${
                activeTab === "incoming"
                  ? "bg-[#5A5A5A] text-white"
                  : "bg-transparent text-gray-400"
              }`}
            >
              Входящие
            </button>
            <button
              onClick={() => setActiveTab("my-requests")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 ${
                activeTab === "my-requests"
                  ? "bg-[#5A5A5A] text-white"
                  : "bg-transparent text-gray-400"
              }`}
            >
              Мои
            </button>
            <button
              onClick={() => setActiveTab("recurring")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 ${
                activeTab === "recurring"
                  ? "bg-[#5A5A5A] text-white"
                  : "bg-transparent text-gray-400"
              }`}
            >
              Повторяющиеся
            </button>
          </div>

          {activeTab === "incoming" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Входящие заявки</h2>
              <div className="flex gap-2">
                <Select value={filterIncomingStatus} onValueChange={setFilterIncomingStatus}>
                  <SelectTrigger className="flex-1 bg-[#2C2C2E] border-[#3A3A3C] text-white">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2C2C2E] border-[#3A3A3C]">
                    <SelectItem value="all" className="text-white">Все</SelectItem>
                    <SelectItem value="in_progress" className="text-white">В обработке</SelectItem>
                    <SelectItem value="awaiting_assignment" className="text-white">Ожидает</SelectItem>
                    <SelectItem value="execution" className="text-white">Исполнение</SelectItem>
                    <SelectItem value="completed" className="text-white">Завершено</SelectItem>
                    <SelectItem value="overdue" className="text-white">Просрочено</SelectItem>
                    <SelectItem value="rejected" className="text-white">Отклонено</SelectItem>
                    <SelectItem value="long_term" className="text-white">Долгосрочные</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterIncomingType} onValueChange={setFilterIncomingType}>
                  <SelectTrigger className="flex-1 bg-[#2C2C2E] border-[#3A3A3C] text-white">
                    <SelectValue placeholder="Тип" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2C2C2E] border-[#3A3A3C]">
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
                  filteredIncomingRequests.map((request, index) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      onCardClick={handleCardClick}
                      renderCardHeader={renderCardHeader}
                      isLast={index === filteredIncomingRequests.length - 1}
                      lastElementRef={lastElementRef}
                      userRole="department-head"
                      variant="compact"
                    />
                  ))
                )}
                {!loading && filteredIncomingRequests.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p>Нет входящих заявок</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "my-requests" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Мои заявки</h2>
              <div className="flex gap-2">
                <Select value={filterMyStatus} onValueChange={setFilterMyStatus}>
                  <SelectTrigger className="flex-1 bg-[#2C2C2E] border-[#3A3A3C] text-white">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2C2C2E] border-[#3A3A3C]">
                    <SelectItem value="all" className="text-white">Все</SelectItem>
                    <SelectItem value="in_progress" className="text-white">В обработке</SelectItem>
                    <SelectItem value="awaiting_assignment" className="text-white">Ожидает</SelectItem>
                    <SelectItem value="execution" className="text-white">Исполнение</SelectItem>
                    <SelectItem value="completed" className="text-white">Завершено</SelectItem>
                    <SelectItem value="overdue" className="text-white">Просрочено</SelectItem>
                    <SelectItem value="long_term" className="text-white">Долгосрочные</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterMyType} onValueChange={setFilterMyType}>
                  <SelectTrigger className="flex-1 bg-[#2C2C2E] border-[#3A3A3C] text-white">
                    <SelectValue placeholder="Тип" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2C2C2E] border-[#3A3A3C]">
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
                  filteredMyRequests.map((request, index) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      onCardClick={handleMyCardClick}
                      renderCardHeader={renderCardHeader}
                      isLast={index === filteredMyRequests.length - 1}
                      lastElementRef={lastElementRef}
                      userRole="department-head"
                      variant="compact"
                    />
                  ))
                )}
                {!loading && filteredMyRequests.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p>У вас пока нет заявок</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "recurring" && (
            <div className="space-y-4 pb-40">
              <h2 className="text-lg font-bold text-white">Повторяющиеся задачи</h2>
              <RecurringTasksList
                userRole="department-head"
                isDesktop={false}
                onShowMap={() => {}}
                onDeleteTask={async (id) => {
                  try {
                    await deleteRecurringTask(id);
                    toast({ title: "Задача удалена" });
                  } catch {
                    toast({ title: "Ошибка", variant: "destructive" });
                  }
                }}
              />
            </div>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}
