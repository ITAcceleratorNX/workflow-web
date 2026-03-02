"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  LayoutGrid,
  BarChart3,
  Plus,
  Calendar,
} from "lucide-react";

interface Stats {
  statusCounts?: {
    new?: number;
    inWork?: number;
    completed?: number;
    overdue?: number;
  };
}

interface DashboardKpiCardsProps {
  stats?: Stats | null;
  /** Override counts when stats structure differs (e.g. manager kpi) */
  counts?: { new?: number; inWork?: number; completed?: number; overdue?: number };
  createRequestHref: string;
  createBookingHref?: string;
  statisticsHref: string;
  requestsHref: string;
  variant?: "admin" | "manager";
  /** Скрыть кнопки «Создать заявку», «Создать бронь», «Статистика» (для менеджера на десктопе) */
  hideActionButtons?: boolean;
}

export function DashboardKpiCards({
  stats,
  counts,
  createRequestHref,
  createBookingHref = "/meeting-rooms",
  statisticsHref,
  requestsHref,
  variant = "admin",
  hideActionButtons = false,
}: DashboardKpiCardsProps) {
  const newCount = counts?.new ?? stats?.statusCounts?.new ?? 0;
  const inWorkCount = counts?.inWork ?? stats?.statusCounts?.inWork ?? 0;
  const completedCount = counts?.completed ?? stats?.statusCounts?.completed ?? 0;
  const overdueCount = counts?.overdue ?? stats?.statusCounts?.overdue ?? 0;

  const firstLabel = variant === "manager" ? "Экстренные" : "Новые";
  const kpiCards = [
    {
      label: firstLabel,
      value: newCount,
      icon: Clock,
      color: "bg-[#E85D2B]/20 text-[#E85D2B]",
      borderColor: "border-[#E85D2B]/30",
    },
    {
      label: "В работе",
      value: inWorkCount,
      icon: Users,
      color: "bg-[#2A9D8F]/20 text-[#2A9D8F]",
      borderColor: "border-[#2A9D8F]/30",
    },
    {
      label: "Завершено",
      value: completedCount,
      icon: CheckCircle,
      color: "bg-emerald-500/20 text-emerald-400",
      borderColor: "border-emerald-500/30",
    },
    {
      label: "Просрочено",
      value: overdueCount,
      icon: AlertTriangle,
      color: "bg-red-500/20 text-red-400",
      borderColor: "border-red-500/30",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={requestsHref}>
              <Card className={`bg-[#2C2C2E] border ${item.borderColor} hover:border-[#E85D2B]/50 transition-colors cursor-pointer`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-white/60">{item.label}</p>
                      <p className="text-xl font-bold text-white">{item.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {!hideActionButtons && (
      <div className="flex flex-wrap gap-3">
        <Link href={createRequestHref}>
          <Button className="bg-[#E85D2B] hover:bg-[#E85D2B]/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Создать заявку
          </Button>
        </Link>
        <Link href={createBookingHref}>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <Calendar className="w-4 h-4 mr-2" />
            Создать бронь
          </Button>
        </Link>
        <Link href={statisticsHref}>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <BarChart3 className="w-4 h-4 mr-2" />
            Статистика
          </Button>
        </Link>
      </div>
      )}
    </div>
  );
}
