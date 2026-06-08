"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestCard } from "@/components/RequestCard";
import { TasksSection } from "@/components/tasks/tasks-section";
import { ExecutorRoomsRequestsView } from "@/components/meeting-rooms/ExecutorRoomsRequestsView";
import { useExecutorRequestCardHeader } from "@/components/executor/requests/executor-request-card-header";
import { sortAssignedTasksByType } from "@/components/executor/requests/executor-requests-constants";
import type { UseExecutorHomeResult } from "@/hooks/use-executor-home";

type ExecutorHomeDesktopProps = UseExecutorHomeResult;

export function ExecutorHomeDesktop({
  isBookingTab,
  stats,
  myRating,
  assignedRequests,
  myRequests,
  completedRequests,
  clientRatings,
  offices,
  handleRequestClick,
}: ExecutorHomeDesktopProps) {
  const renderCardHeader = useExecutorRequestCardHeader();
  const sortedAssigned = sortAssignedTasksByType(assignedRequests ?? []);

  return (
    <div className="client-desktop-content p-6 lg:p-8 max-w-6xl mx-auto">
      {isBookingTab ? (
        <div className="client-desktop-dark">
          <h1 className="text-xl font-semibold text-white mb-4">Бронирование</h1>
          <ExecutorRoomsRequestsView
            offices={offices}
            myRequests={myRequests}
            assignedRequests={assignedRequests}
            completedRequests={completedRequests}
            onRequestClick={(request) => handleRequestClick(request.id)}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl p-5 bg-[#2C2C2E] border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#E85D2B]/20">
                  <AlertTriangle className="w-5 h-5 text-[#E85D2B]" />
                </div>
                <div>
                  <p className="text-xs text-white/70">Просрочено</p>
                  <p className="text-xl font-bold text-white">{stats?.overdue ?? 0}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl p-5 bg-[#2C2C2E] border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#E85D2B]/20">
                  <Clock className="w-5 h-5 text-[#E85D2B]" />
                </div>
                <div>
                  <p className="text-xs text-white/70">В работе</p>
                  <p className="text-xl font-bold text-white">{stats?.inWork ?? 0}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl p-5 bg-[#2C2C2E] border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#E85D2B]/20">
                  <CheckCircle className="w-5 h-5 text-[#E85D2B]" />
                </div>
                <div>
                  <p className="text-xs text-white/70">Завершено</p>
                  <p className="text-xl font-bold text-white">{stats?.completed ?? 0}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl p-5 bg-[#2C2C2E] border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#E85D2B]/20">
                  <Star className="w-5 h-5 text-[#E85D2B]" />
                </div>
                <div>
                  <p className="text-xs text-white/70">Рейтинг</p>
                  <p className="text-xl font-bold text-white">{myRating ?? "—"}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mb-6 flex flex-wrap gap-3">
            <Link href="/executor/management">
              <Button className="bg-[#E85D2B] hover:bg-[#D94F15] text-white">
                Мой кабинет
              </Button>
            </Link>
            <Link href="/executor/management/scan-qr">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                QR сканер
              </Button>
            </Link>
          </div>
          <TasksSection layout="embedded" />
          <section className="client-desktop-dark mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Текущие задачи</h2>
              <Link href="/executor/requests">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Все заявки
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {sortedAssigned.map((request, index) => (
                <RequestCard
                  key={request.id ?? index}
                  request={request}
                  onCardClick={() => handleRequestClick(request.id)}
                  renderCardHeader={renderCardHeader}
                  clientRating={clientRatings[request.id] as never}
                  userRole="executor"
                  variant="compact"
                />
              ))}
              {sortedAssigned.length === 0 && (
                <p className="text-white/60 text-sm py-4">Нет назначенных задач</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
