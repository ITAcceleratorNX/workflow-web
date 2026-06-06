"use client";

import React, { useEffect, useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useIsDesktop } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { useRequestStore } from "@/stores/useRequestStore";
import { RequestGroup } from "@/stores/useRequestStore";
import { RequestCard } from "@/components/RequestCard";
import PullToRefresh from "@/components/pull-to-refresh";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { BottomNav } from "@/components/BottomNav";
import { RequestDetails } from "@/components/RequestDetails";
import { AdminManagerRequestsDesktopFrame } from "@/components/layout/AdminManagerRequestsDesktopFrame";
import { useRequestSelectionFromUrl } from "@/hooks/useRequestSelectionFromUrl";
import { getStatusOptionsForRole, REQUEST_TYPE_FILTER_OPTIONS } from "@/constants/requests";
import { filterRequestGroups } from "@/lib/request-utils";

type OfficeType = { id: number; name: string; city?: string; address?: string };

export default function ManagerRequestsPage() {
  const isDesktop = useIsDesktop();
  const { token } = useAuthStore();

  const { requests, setRequests } = useRequestStore();

  const [offices, setOffices] = useState<OfficeType[]>([]);
  const [office, setOffice] = useState("all");
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const lastElementRef = useRef<HTMLDivElement | null>(null);

  const statusFilterOptions = useMemo(() => getStatusOptionsForRole('manager'), []);

  const fetchRequests = useCallback(
    async (pageToLoad = 1) => {
      if (!token) return;
      const isFirstPage = pageToLoad === 1;
      if (isFirstPage) setLoading(true);
      else setLoadingMore(true);
      try {
        const params = new URLSearchParams({
          page: pageToLoad.toString(),
          pageSize: "10",
        });
        if (filterStatus !== "all" && filterStatus !== "long_term") {
          params.append("status", filterStatus);
        }
        if (filterType !== "all") {
          params.append("priority", filterType);
        }

        const response = await api.get(`/request-groups?${params.toString()}`);
        const newRequests = response.data.data || [];
        const totalPages = response.data.totalPages ?? 1;

        if (isFirstPage) {
          setRequests(newRequests);
        } else {
          setRequests((prev) => [
            ...prev,
            ...newRequests.filter((r: RequestGroup) => !prev.some((p) => p.id === r.id)),
          ]);
        }
        setHasMore(pageToLoad < totalPages);
        setPage(pageToLoad);
      } catch (error) {
        console.error("Ошибка при загрузке заявок:", error);
      } finally {
        if (isFirstPage) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [token, filterStatus, filterType, setRequests]
  );

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) fetchRequests(page + 1);
  };

  const fetchOffices = useCallback(async () => {
    try {
      const response = await api.get<OfficeType[]>("/offices");
      setOffices(response.data || []);
    } catch (err) {
      console.error("Ошибка загрузки офисов:", err);
    }
  }, []);

  useEffect(() => {
    fetchRequests(1);
    fetchOffices();
  }, []);

  useEffect(() => {
    fetchRequests(1);
  }, [filterStatus, filterType]);

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

  const handleRefresh = async () => {
    await fetchRequests(1);
  };

  const renderCardHeader = useCallback((requestGroup: RequestGroup) => {
    const isLongTerm = requestGroup.requests.some((req) => req.is_long_term);
    return (
      <div className="pb-3 px-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base leading-tight line-clamp-2 text-gray-900">
              Заявка #{requestGroup.id}
            </h3>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                isLongTerm
                  ? "text-[#114A65] bg-[#114A65]/20"
                  : requestGroup.request_type === "urgent"
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
    );
  }, []);

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

  const handleRequestUpdated = () => {
    fetchRequests(1);
    clearAfterUpdate();
  };

  if (isDesktop) {
    const listContent = (
      <>
        {loading ? (
          <div className="text-center py-12 text-white/60">Загрузка...</div>
        ) : (
          filteredRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onCardClick={handleCardClick}
              renderCardHeader={renderCardHeader}
              userRole="manager"
              variant="compact"
            />
          ))
        )}
        {!loading && filteredRequests.length === 0 && (
          <div className="text-center py-12 text-white/60">Нет заявок</div>
        )}
        {!loading && hasMore && filteredRequests.length > 0 && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              className="bg-transparent border-white/20 text-white hover:bg-[#E04A0A]"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Загрузить ещё
            </Button>
          </div>
        )}
      </>
    );

    const filtersContent = (
      <>
        <Select value={office} onValueChange={setOffice}>
          <SelectTrigger className="w-[140px] bg-[#2C2C2E] border-white/10 text-white">
            <SelectValue placeholder="Офис" />
          </SelectTrigger>
          <SelectContent className="bg-[#2C2C2E] border-white/10">
            <SelectItem value="all">Все офисы</SelectItem>
            {offices.map((o) => (
              <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={(v) => setPeriod(v as "week" | "month" | "year")}>
          <SelectTrigger className="w-[120px] bg-[#2C2C2E] border-white/10 text-white">
            <SelectValue placeholder="Период" />
          </SelectTrigger>
          <SelectContent className="bg-[#2C2C2E] border-white/10">
            <SelectItem value="week">Неделя</SelectItem>
            <SelectItem value="month">Месяц</SelectItem>
            <SelectItem value="year">Год</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] bg-[#2C2C2E] border-white/10 text-white">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent className="bg-[#2C2C2E] border-white/10">
            {statusFilterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px] bg-[#2C2C2E] border-white/10 text-white">
            <SelectValue placeholder="Тип" />
          </SelectTrigger>
          <SelectContent className="bg-[#2C2C2E] border-white/10">
            {REQUEST_TYPE_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </>
    );

    return (
      <AdminManagerRequestsDesktopFrame
        filtersSlot={filtersContent}
        listSlot={listContent}
        detailSlot={
          displayRequest ? (
            <RequestDetails
              request={displayRequest}
              onClose={handleClosePanel}
              onRequestUpdated={handleRequestUpdated}
              userRole="manager"
              sourceTab="myTasks"
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
    <div className="min-h-screen bg-[#1C1C1E] pb-[calc(120px+env(safe-area-inset-bottom,0px))]">
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
            <div className="flex flex-wrap gap-1">
              <Select value={office} onValueChange={setOffice}>
                <SelectTrigger className="flex-1 min-w-[120px] bg-[#2C2C2E] border-[#3A3A3C] text-white">
                  <SelectValue placeholder="Офис" />
                </SelectTrigger>
                <SelectContent className="bg-[#2C2C2E] border-[#3A3A3C]">
                  <SelectItem value="all" className="text-white">
                    Все офисы
                  </SelectItem>
                  {offices.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)} className="text-white">
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={period} onValueChange={(v) => setPeriod(v as "week" | "month" | "year")}>
                <SelectTrigger className="flex-1 min-w-[120px] bg-[#2C2C2E] border-[#3A3A3C] text-white">
                  <SelectValue placeholder="Период" />
                </SelectTrigger>
                <SelectContent className="bg-[#2C2C2E] border-[#3A3A3C]">
                  <SelectItem value="week" className="text-white">
                    Неделя
                  </SelectItem>
                  <SelectItem value="month" className="text-white">
                    Месяц
                  </SelectItem>
                  <SelectItem value="year" className="text-white">
                    Год
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="flex-1 min-w-[120px] bg-[#2C2C2E] border-[#3A3A3C] text-white">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent className="bg-[#2C2C2E] border-[#3A3A3C]">
                  {statusFilterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-white">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="flex-1 min-w-[120px] bg-[#2C2C2E] border-[#3A3A3C] text-white">
                  <SelectValue placeholder="Тип" />
                </SelectTrigger>
                <SelectContent className="bg-[#2C2C2E] border-[#3A3A3C]">
                  {REQUEST_TYPE_FILTER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-white">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 pb-40">
              {loading ? (
                <div className="text-center py-8 text-gray-400">Загрузка...</div>
              ) : (
                filteredRequests.map((request, index) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onCardClick={handleCardClick}
                    renderCardHeader={renderCardHeader}
                    isLast={index === filteredRequests.length - 1}
                    lastElementRef={lastElementRef as React.RefObject<HTMLDivElement>}
                    userRole="manager"
                    variant="compact"
                  />
                ))
              )}
              {!loading && filteredRequests.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p>Нет заявок</p>
                </div>
              )}

              {!loading && hasMore && filteredRequests.length > 0 && (
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
        </PullToRefresh>
      </div>

      <BottomNav activeTab="requests" />
    </div>
  );
}
