"use client";

import React, { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { sortRequests, useRequestStore } from "@/stores/useRequestStore";
import { RequestGroup } from "@/stores/useRequestStore";
import { RequestCard } from "@/components/RequestCard";
import { RecurringTasksList } from "@/components/recurring-tasks";
import PullToRefresh from "@/components/pull-to-refresh";
import api, { deleteRecurringTask } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToast } from "@/hooks/use-toast";
import { RequestDetails } from "@/components/RequestDetails";
import { AdminManagerRequestsDesktopFrame } from "@/components/layout/AdminManagerRequestsDesktopFrame";
import { useRequestSelectionFromUrl } from "@/hooks/useRequestSelectionFromUrl";

export default function AdminRequestsPage() {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { token } = useAuthStore();
  const { toast } = useToast();

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
  const [loadingMore, setLoadingMore] = useState(false);
  const lastElementRef = useRef<HTMLDivElement>(null);

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
        if (isFirstPage) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [token, filterIncomingStatus, filterIncomingType, setIncomingRequests, setMyRequests]
  );

  useEffect(() => {
    fetchRequests(1);
  }, []);

  useEffect(() => {
    fetchRequests(1);
  }, [filterIncomingStatus, filterIncomingType]);

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

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchRequests(page + 1);
    }
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

  const {
    displayRequest,
    selectRequest,
    closeDetail: handleClosePanel,
    clearAfterUpdate,
  } = useRequestSelectionFromUrl({
    requestsBasePath: "/admin-worker/requests",
    requestLists: [incomingRequests, myRequests],
    fallbackLists: [filteredIncomingRequests, filteredMyRequests],
    isDesktop,
    isDataReady: !loading,
  });

  const handleCardClick = selectRequest;
  const handleMyCardClick = selectRequest;

  const handleRequestUpdated = () => {
    fetchRequests(1);
    clearAfterUpdate();
  };

  if (isDesktop) {
    const desktopRequests = activeTab === "incoming" ? filteredIncomingRequests : activeTab === "my-requests" ? filteredMyRequests : [];

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
            userRole="admin-worker"
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
              userRole="admin-worker"
              variant="compact"
            />
          ))
        )}
        {!loading && activeTab !== "recurring" && desktopRequests.length === 0 && (
          <div className="text-center py-12 text-white/60">Нет заявок</div>
        )}
        {!loading && activeTab !== "recurring" && hasMore && desktopRequests.length > 0 && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="border-white/20 text-white hover:bg-white/10"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Загрузка...
                </>
              ) : (
                "Загрузить ещё"
              )}
            </Button>
          </div>
        )}
      </>
    );

    return (
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
              userRole="admin-worker"
              sourceTab="incoming"
              hideFullModeButton
              embedInPanel
            />
          ) : null
        }
        displayRequestId={displayRequest?.id}
        onCloseDetail={handleClosePanel}
      />
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">Заявки</h1>
        <Link href="/create-request">
          <Button className="h-12 px-5 bg-[#F35713] hover:bg-[#E04A0A] text-white font-semibold rounded-2xl">
            <Plus className="h-4 w-4 mr-2" />
            Создать
          </Button>
        </Link>
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-4">
          {/* Tab switcher - как у клиента */}
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
                      lastElementRef={lastElementRef as React.RefObject<HTMLDivElement>}
                      userRole="admin-worker"
                      variant="compact"
                    />
                  ))
                )}
                {!loading && filteredIncomingRequests.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p>Нет входящих заявок</p>
                  </div>
                )}
                {!loading && hasMore && filteredIncomingRequests.length > 0 && (
                  <div className="flex justify-center pt-4 pb-2">
                    <Button
                      variant="outline"
                      className="bg-[#2C2C2E] border-[#3A3A3C] text-white hover:bg-[#3D3D3D]"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Загрузка...
                        </>
                      ) : (
                        "Загрузить ещё"
                      )}
                    </Button>
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
              <div className="space-y-4 pb-12">
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
                      lastElementRef={lastElementRef as React.RefObject<HTMLDivElement>}
                      userRole="admin-worker"
                      variant="compact"
                    />
                  ))
                )}
                {!loading && filteredMyRequests.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p>У вас пока нет заявок</p>
                  </div>
                )}
                {!loading && hasMore && filteredMyRequests.length > 0 && (
                  <div className="flex justify-center pt-4 pb-2">
                    <Button
                      variant="outline"
                      className="bg-[#2C2C2E] border-[#3A3A3C] text-white hover:bg-[#3D3D3D]"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Загрузка...
                        </>
                      ) : (
                        "Загрузить ещё"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "recurring" && (
            <div className="space-y-4 admin-management-content">
              <h2 className="text-lg font-bold text-white">Повторяющиеся задачи</h2>
              <RecurringTasksList
                userRole="admin-worker"
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
