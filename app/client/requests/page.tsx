"use client";

import React, { useEffect, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { useRequestStore } from "@/stores/useRequestStore";
import type { RequestGroup, SubRequest } from "@/stores/useRequestStore";
import { RequestCard } from "@/components/RequestCard";
import { RequestDetails } from "@/components/RequestDetails";
import { AdminManagerRequestsDesktopFrame } from "@/components/layout/AdminManagerRequestsDesktopFrame";
import { RoleBasedActionMenu } from "@/components/action-menu/RoleBasedActionMenu";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import PullToRefresh from "@/components/pull-to-refresh";
import { RatingModal } from "@/components/RatingModal";
import { CardHeader } from "@/components/ui/card";
import { CheckCircle, Clock, User, XCircle } from "lucide-react";
import { useRequestSelectionFromUrl } from "@/hooks/useRequestSelectionFromUrl";

const translateStatus = (status: string) => {
  switch (status) {
    case "completed": return "Завершено";
    case "in_progress": return "В процессе";
    case "execution": return "Выполняется";
    case "awaiting_assignment": return "Ожидает назначения";
    case "awaiting_sla": return "Ожидание времени выполнения";
    case "assigned": return "Назначена";
    case "rejected": return "Отклонена";
    default: return status;
  }
};

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case "completed": return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    case "in_progress":
    case "execution": return <Clock className="w-4 h-4 text-[#114A65]" />;
    case "awaiting_assignment":
    case "awaiting_sla": return <Clock className="w-3 h-3" />;
    case "assigned": return <User className="w-3 h-3" />;
    case "rejected": return <XCircle className="w-3 h-3" />;
    default: return null;
  }
};

export default function ClientRequestsPage() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { token } = useAuthStore();
  const { toast } = useToast();

  const { requests, setRequests } = useRequestStore();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [userRatings, setUserRatings] = useState<Record<number, { rating: number; comment?: string }>>({});
  const [clientRatings, setClientRatings] = useState<Record<number, any>>({});
  const [requestToRate, setRequestToRate] = useState<SubRequest | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [showRatingModal, setShowRatingModal] = useState(false);

  const fetchRequests = useCallback(async (pageToLoad = 1) => {
    if (!token) return;
    const isFirstPage = pageToLoad === 1;
    if (isFirstPage) setLoading(true);
    else setLoadingMore(true);
    try {
      const response = await api.get(`/request-groups?page=${pageToLoad}&pageSize=10`);
      const list: RequestGroup[] = response.data?.requests ?? [];
      if (isFirstPage) {
        setRequests(list);
      } else {
        setRequests((prev) => {
          const existingIds = new Set(prev.map((r) => r.id));
          const toAdd = list.filter((r) => !existingIds.has(r.id));
          return [...prev, ...toAdd];
        });
      }
      (list as any[]).forEach((g: any) => {
        if (g.clientRatings?.length) {
          setClientRatings((prev) => ({ ...prev, [g.id]: g.clientRatings }));
        }
      });
      setHasMore(list.length === 10);
      setPage(pageToLoad);
    } catch (e) {
      console.error(e);
    } finally {
      if (isFirstPage) setLoading(false);
      else setLoadingMore(false);
    }
  }, [token, setRequests]);

  useEffect(() => {
    fetchRequests(1);
  }, [fetchRequests]);

  const filteredRequests = useMemo(
    () =>
      requests.filter((r) => {
        const statusOk =
          filterStatus === "all" ||
          (filterStatus === "long_term" ? r.requests?.some((req) => req.is_long_term) : r.status === filterStatus);
        const typeOk = filterType === "all" || r.request_type === filterType;
        return statusOk && typeOk;
      }),
    [requests, filterStatus, filterType]
  );

  const {
    displayRequest,
    selectRequest: handleCardClick,
    closeDetail: handleClosePanel,
    clearAfterUpdate,
    setSelectedRequest,
  } = useRequestSelectionFromUrl({
    requestsBasePath: "/client/requests",
    requestLists: [requests],
    fallbackLists: [filteredRequests],
    isDesktop,
    isDataReady: !loading,
  });

  const handleRequestUpdated = () => {
    fetchRequests(1);
    clearAfterUpdate();
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchRequests(page + 1);
    }
  };

  const handleDeleteSubRequest = async (subRequest: SubRequest) => {
    try {
      await api.delete(`/requests/${subRequest.id}`);
      if (displayRequest) {
        const updated = displayRequest.requests.filter((r) => r.id !== subRequest.id);
        const next = { ...displayRequest, requests: updated };
        setSelectedRequest(next);
        const updatedList = requests.map((r) => (r.id === displayRequest.id ? next : r)).filter((r) => r.requests.length > 0);
        setRequests(updatedList);
        if (updated.length === 0) {
          handleClosePanel();
        }
      }
      toast({ title: "Подзаявка удалена" });
    } catch {
      toast({ title: "Ошибка удаления", variant: "destructive" });
    }
  };

  const handleRateExecutor = async () => {
    if (!requestToRate || ratingValue <= 0) return;
    try {
      await api.post("/ratings", {
        request_id: requestToRate.id,
        rating: ratingValue,
        comment: ratingComment || undefined,
      });
      setUserRatings((prev) => ({ ...prev, [requestToRate.id]: { rating: ratingValue, comment: ratingComment } }));
      setShowRatingModal(false);
      setRequestToRate(null);
      setRatingValue(0);
      setRatingComment("");
      toast({ title: "Оценка сохранена" });
    } catch {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  };

  const renderCardHeader = useCallback(
    (requestGroup: RequestGroup) => (
      <CardHeader className="pb-3 px-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base leading-tight line-clamp-2 text-card-foreground">
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
          <div className="flex gap-1 items-center">
            {getStatusIcon(requestGroup.status)}
            <RoleBasedActionMenu
              request={requestGroup}
              isDesktop={isDesktop}
              userRole="client"
              isSubRequest={false}
              onViewDetails={(req) => handleCardClick(req)}
              onRateRequest={(subReq) => {
                setRequestToRate(subReq);
                setRatingValue(userRatings[subReq.id]?.rating || 0);
                setRatingComment("");
                setShowRatingModal(true);
              }}
              onDelete={handleDeleteSubRequest}
            />
          </div>
        </div>
      </CardHeader>
    ),
    [isDesktop, userRatings, handleDeleteSubRequest]
  );

  if (isDesktop) {
    return (
      <>
        <AdminManagerRequestsDesktopFrame
          filtersSlot={
            <>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px] bg-[#2C2C2E] border-white/10 text-white">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent className="bg-[#2C2C2E] border-white/10">
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="in_progress">В обработке</SelectItem>
                  <SelectItem value="awaiting_assignment">Ожидает назначения</SelectItem>
                  <SelectItem value="execution">Исполнение</SelectItem>
                  <SelectItem value="completed">Завершено</SelectItem>
                  <SelectItem value="long_term">Долгосрочные</SelectItem>
                  <SelectItem value="rejected">Отклонено</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px] bg-[#2C2C2E] border-white/10 text-white">
                  <SelectValue placeholder="Тип заявки" />
                </SelectTrigger>
                <SelectContent className="bg-[#2C2C2E] border-white/10">
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="normal">Обычная</SelectItem>
                  <SelectItem value="urgent">Экстренная</SelectItem>
                  <SelectItem value="planned">Плановая</SelectItem>
                </SelectContent>
              </Select>
            </>
          }
          listSlot={
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
                    clientRating={clientRatings[request.id]}
                    userRole="client"
                    variant="compact"
                  />
                ))
              )}
              {!loading && filteredRequests.length === 0 && (
                <div className="text-center py-12 text-white/60">У вас пока нет заявок</div>
              )}
              {!loading && hasMore && filteredRequests.length > 0 && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
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
            </>
          }
          detailSlot={
            displayRequest ? (
              <RequestDetails
                request={displayRequest}
                onClose={handleClosePanel}
                onRequestUpdated={handleRequestUpdated}
                sourceTab="my-requests"
                hideFullModeButton
                userRole="client"
                fullModeRedirectBase="/client"
                onDelete={handleDeleteSubRequest}
                onRateRequest={(subReq) => {
                  setRequestToRate(subReq);
                  setRatingValue(userRatings[subReq.id]?.rating || 0);
                  setRatingComment("");
                  setShowRatingModal(true);
                }}
                embedInPanel
              />
            ) : null
          }
          displayRequestId={displayRequest?.id}
          onCloseDetail={handleClosePanel}
        />
        <RatingModal
          isOpen={showRatingModal && !!requestToRate}
          onClose={() => {
            setShowRatingModal(false);
            setRequestToRate(null);
            setRatingValue(0);
            setRatingComment("");
          }}
          ratingValue={ratingValue}
          onRatingChange={setRatingValue}
          onSubmit={handleRateExecutor}
          currentRating={requestToRate ? userRatings[requestToRate.id]?.rating : undefined}
          comment={ratingComment}
          onCommentChange={setRatingComment}
        />
      </>
    );
  }

  return (
    <PullToRefresh onRefresh={fetchRequests}>
      <div className="min-h-screen bg-[#1C1C1E] pb-24 pt-4 px-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-white">Заявки</h1>
          <Link href="/create-request">
            <Button className="h-12 px-5 bg-[#E85D2B] hover:bg-[#D94F15] text-white font-semibold rounded-2xl">
              <Plus className="h-4 w-4 mr-2" />
              Создать
            </Button>
          </Link>
        </div>
        <div className="flex gap-2 mb-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="flex-1 bg-[#2C2C2E] border-gray-700 text-white">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent className="bg-[#2C2C2E] border-gray-700">
              <SelectItem value="all" className="text-white">Все</SelectItem>
              <SelectItem value="in_progress" className="text-white">В обработке</SelectItem>
              <SelectItem value="awaiting_assignment" className="text-white">Ожидает</SelectItem>
              <SelectItem value="execution" className="text-white">Исполнение</SelectItem>
              <SelectItem value="completed" className="text-white">Завершено</SelectItem>
              <SelectItem value="rejected" className="text-white">Отклонено</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="flex-1 bg-[#2C2C2E] border-gray-700 text-white">
              <SelectValue placeholder="Тип" />
            </SelectTrigger>
            <SelectContent className="bg-[#2C2C2E] border-gray-700">
              <SelectItem value="all" className="text-white">Все</SelectItem>
              <SelectItem value="normal" className="text-white">Обычная</SelectItem>
              <SelectItem value="urgent" className="text-white">Экстренная</SelectItem>
              <SelectItem value="planned" className="text-white">Плановая</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Загрузка...</div>
          ) : (
            filteredRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onCardClick={handleCardClick}
                renderCardHeader={renderCardHeader}
                clientRating={clientRatings[request.id]}
                userRole="client"
                variant="compact"
              />
            ))
          )}
          {!loading && filteredRequests.length === 0 && (
            <div className="text-center py-8 text-gray-400">У вас пока нет заявок</div>
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
        <RatingModal
          isOpen={showRatingModal && !!requestToRate}
          onClose={() => {
            setShowRatingModal(false);
            setRequestToRate(null);
            setRatingValue(0);
            setRatingComment("");
          }}
          ratingValue={ratingValue}
          onRatingChange={setRatingValue}
          onSubmit={handleRateExecutor}
          currentRating={requestToRate ? userRatings[requestToRate.id]?.rating : undefined}
          comment={ratingComment}
          onCommentChange={setRatingComment}
        />
      </div>
    </PullToRefresh>
  );
}
