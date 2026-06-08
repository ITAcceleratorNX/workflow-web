"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import api from "@/lib/api";
import { RequestCard } from "@/components/RequestCard";
import { DashboardKpiCards } from "@/components/dashboard/DashboardKpiCards";
import { DesktopHubCards } from "@/components/layout/desktop-hub-cards";
import { TasksSection } from "@/components/tasks/tasks-section";
import { DEPARTMENT_HEAD_HOME_CARDS } from "./department-head-home-constants";
import { RequestGroup } from "@/stores/useRequestStore";
import { sortRequests } from "@/stores/useRequestStore";

interface Stats {
  totalRequests: number;
  statusCounts: {
    awaitingAssignment: number;
    new: number;
    inWork: number;
    completed: number;
    overdue: number;
  };
  requestTypeSummary?: {
    urgent: number;
    planned: number;
    normal: number;
  };
}

/** Desktop dashboard — без redesign: KPI + текущие заявки. */
export function DepartmentHeadHomeDesktop() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [awaitingRequests, setAwaitingRequests] = useState<RequestGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/analytics/stats/department-head");
      setStats(res.data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchAwaitingRequests = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: "1",
        pageSize: "20",
        status: "awaiting_assignment",
      });
      const response = await api.get(`/request-groups?${params.toString()}`);
      const other = response.data?.otherRequests || [];
      const my = response.data?.myRequests || [];
      const all = sortRequests([...other, ...my]);
      setAwaitingRequests(all);
    } catch (error) {
      console.error("Ошибка загрузки заявок:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchAwaitingRequests();
  }, [fetchAwaitingRequests]);

  const handleRequestClick = (request: RequestGroup) => {
    router.push(`/department-head/requests?requestId=${request.id}`, { scroll: false });
  };

  const renderCardHeader = (requestGroup: RequestGroup) => (
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
  );

  return (
    <div className="px-4 py-4 sm:px-5 sm:py-6 md:px-6 md:py-8 lg:px-8 max-w-7xl mx-auto min-w-0 client-desktop-dark">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Управление</h1>
          <p className="text-sm text-white/60 mt-1">Офис и заявки</p>
        </div>
        <Link
          href="/notifications"
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Уведомления"
        >
          <Bell className="w-6 h-6 text-white" />
        </Link>
      </div>

      <DesktopHubCards
        cards={DEPARTMENT_HEAD_HOME_CARDS.map((c) => ({
          key: c.key,
          title: c.title,
          subtitle: c.subtitle,
          icon: c.icon,
          href: c.href,
        }))}
        columns={3}
        className="mb-8"
      />

      <TasksSection layout="embedded" />

      <div className="mb-4 md:mb-6 mt-8">
        <DashboardKpiCards
          stats={{
            statusCounts: {
              new: stats?.statusCounts?.new ?? 0,
              inWork: stats?.statusCounts?.inWork ?? 0,
              completed: stats?.statusCounts?.completed ?? 0,
              overdue: stats?.statusCounts?.overdue ?? 0,
            },
          }}
          createRequestHref="/create-request"
          createBookingHref="/meeting-rooms"
          statisticsHref="/department-head/statistics"
          requestsHref="/department-head/requests"
          variant="manager"
          hideActionButtons
        />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white mb-4">Текущие заявки</h2>
        {loading ? (
          <div className="text-center py-12 text-white/60">Загрузка...</div>
        ) : awaitingRequests.length === 0 ? (
          <div className="text-center py-12 text-white/60">Нет заявок, ожидающих назначения</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {awaitingRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onCardClick={handleRequestClick}
                renderCardHeader={renderCardHeader}
                userRole="department-head"
                variant="compact"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/** @deprecated Use DepartmentHeadHomeDesktop */
export const DepartmentHeadDesktopDashboard = DepartmentHeadHomeDesktop;
