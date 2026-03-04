"use client"

import "@/lib/android-bridge"
import React, {useEffect, useState, useCallback, useMemo} from "react"
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {Button} from "@/components/ui/button"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {Calendar} from "@/components/ui/calendar"
import {format} from "date-fns"
import {ru} from "date-fns/locale"
import {LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from "recharts"
import {AlertTriangle, BarChart3, Calendar as CalendarLucid, ChevronLeft, Download} from "lucide-react"
import Header from "@/app/header/Header";
import api from "@/lib/api";
import {useRouter} from "next/navigation";
import {useMediaQuery} from "@/hooks/use-media-query";
import {BottomNav} from "@/components/BottomNav";
import PullToRefresh from "@/components/pull-to-refresh";
import Link from "next/link";
import {useAuthStore} from "@/stores/useAuthStore";
import {useStatsStore} from "@/stores/statsStore";
import { MeetingRoomStatistics } from "@/components/meeting-rooms/MeetingRoomStatistics";
import dynamic from "next/dynamic";

const ManagerAnalytics = dynamic(() => import("@/components/ManagerAnalytics"), { ssr: false });

interface ChartData {
    date: string;
    count: number;
}

declare global {
  interface Window {
    webkit?: {
      messageHandlers: {
        saveFile: {
          postMessage: (message: {
            filename: string;
            base64Data: string;
            mimeType: string;
          }) => void;
        };
      };
    };
  }
}

type OfficeType = {
  id: number
  name: string
  city: string
  address: string
  lat: number | null
  lon: number | null
  photo?: string | null
}

export default function ManagerStatisticsPage() {
  const {token, clearAuth, user} = useAuthStore()
  const router = useRouter()
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [period, setPeriod] = useState("month")
  const [office, setOffice] = useState("all")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [offices, setOffices] = useState<OfficeType[]>([])
  
  const {
    managerStats,
    fetchStats,
    resetStats,
  } = useStatsStore();

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!user || (user.role !== "manager" && user.role !== "admin-worker")) {
      clearAuth();
      router.push("/login");
    }
  }, [hydrated, user, router, clearAuth]);

  const fetchOffices = async () => {
    if (offices.length !== 0) return;
    try {
      const response = await api.get('/offices')
      setOffices(response.data)
    } catch (error) {
      console.error("Failed to fetch offices:", error)
    }
  }

  useEffect(() => {
    if (token && (user?.role === 'manager' || user?.role === 'admin-worker')) {
      fetchStats('manager');
      if (user?.role === 'manager') fetchOffices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  const basePath = user?.role === "admin-worker" ? "/admin-worker" : "/manager";
  const effectiveOffice = user?.role === "admin-worker" && user?.office_id
    ? String(user.office_id)
    : office;

  const chartData: ChartData[] = useMemo(() => {
    if (!managerStats || managerStats.length === 0) return [];
    
    const subset = effectiveOffice === "all" 
      ? managerStats 
      : managerStats.filter((s) => s.officeId === Number(effectiveOffice));
    
    if (startDate && endDate) {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      const map: Record<string, number> = {};

      subset.forEach((s) => {
        Object.entries(s.data).forEach(([date, d]) => {
          if (date >= startDateStr && date <= endDateStr) {
            map[date] = (map[date] || 0) + d.totalRequests;
          }
        });
      });

      return Object.entries(map)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    const now = new Date()
    let periodStartDate: Date;
    if (period === "week") {
      periodStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (period === "month") {
      periodStartDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    } else { // year
      periodStartDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    }
    const periodStartDateStr = periodStartDate.toISOString().split('T')[0]
    const map: Record<string, number> = {}
    subset.forEach((s) => {
      Object.entries(s.data).forEach(([date, d]) => {
        if (date >= periodStartDateStr) map[date] = (map[date] || 0) + d.totalRequests
      })
    })
    return Object.entries(map)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [office, period, startDate, endDate, managerStats]);

  const distribution = useMemo(() => {
    if (!managerStats || managerStats.length === 0) return;

    const subset = effectiveOffice === "all" 
      ? managerStats 
      : managerStats.filter((s) => s.officeId === Number(effectiveOffice));
    
    if (startDate && endDate) {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      let total = 0
      let normal = 0
      let urgent = 0
      let planned = 0
      
      subset.forEach((stat) => {
        Object.entries(stat.data).forEach(([date, data]) => {
          if (date >= startDateStr && date <= endDateStr) {
            total += data.totalRequests
            normal += data.normalRequests || 0
            urgent += data.urgentRequests || 0
            planned += data.plannedRequests || 0
          }
        })
      })
      
      const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)
      return {
        total,
        normal,
        urgent,
        planned,
        normalPercent: pct(normal),
        urgentPercent: pct(urgent),
        plannedPercent: pct(planned),
      }
    }
    
    const now = new Date()
    let periodStartDate: Date;
    if (period === "week") {
      periodStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (period === "month") {
      periodStartDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    } else {
      periodStartDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    }
    const periodStartDateStr = periodStartDate.toISOString().split('T')[0]
    let total = 0
    let normal = 0
    let urgent = 0
    let planned = 0
    subset.forEach((stat) => {
      Object.entries(stat.data).forEach(([date, data]) => {
        if (date >= periodStartDateStr) {
          total += data.totalRequests
          normal += data.normalRequests || 0
          urgent += data.urgentRequests || 0
          planned += data.plannedRequests || 0
        }
      })
    })
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)
    return {
      total,
      normal,
      urgent,
      planned,
      normalPercent: pct(normal),
      urgentPercent: pct(urgent),
      plannedPercent: pct(planned),
    }
  }, [effectiveOffice, period, startDate, endDate, managerStats]);

  const summary = useMemo(() => {
    if (!managerStats || managerStats.length === 0) {
      return {
        total: 0,
        completed: 0,
        overdue: 0,
        inWork: 0,
        newRequests: 0,
        completionRate: 0,
        overdueRate: 0,
        avgPerDay: 0,
      }
    }
    
    const subset = effectiveOffice === "all" 
      ? managerStats 
      : managerStats.filter((s) => s.officeId === Number(effectiveOffice));
    
    if (startDate && endDate) {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      let total = 0
      let completed = 0
      let overdue = 0
      let inWork = 0
      let newRequests = 0
      const dayCounts = new Set<string>()
      
      subset.forEach((stat) => {
        Object.entries(stat.data).forEach(([date, data]) => {
          if (date >= startDateStr && date <= endDateStr) {
            total += data.totalRequests
            completed += data.completedRequests
            overdue += data.overdueRequests || 0;
            inWork += data.inWorkRequests || 0;
            newRequests += data.newRequests || 0;
            dayCounts.add(date)
          }
        })
      })
      
      const days = dayCounts.size || 1
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
      const overdueRate = total > 0 ? Math.round((overdue / total) * 100) : 0
      const avgPerDay = Math.round(total / days)
      return { total, completed, overdue, inWork, newRequests, completionRate, overdueRate, avgPerDay }
    }
    
    const now = new Date()
    let periodStartDate: Date;
    if (period === "week") {
      periodStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (period === "month") {
      periodStartDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    } else {
      periodStartDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    }
    const periodStartDateStr = periodStartDate.toISOString().split('T')[0]
    let total = 0
    let completed = 0
    let overdue = 0
    let inWork = 0
    let newRequests = 0
    const dayCounts = new Set<string>()
    subset.forEach((stat) => {
      Object.entries(stat.data).forEach(([date, data]) => {
        if (date >= periodStartDateStr) {
          total += data.totalRequests
          completed += data.completedRequests
          overdue += data.overdueRequests || 0;
          inWork += data.inWorkRequests || 0;
          newRequests += data.newRequests || 0;
          dayCounts.add(date)
        }
      })
    })
    const days = dayCounts.size || 1
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    const overdueRate = total > 0 ? Math.round((overdue / total) * 100) : 0
    const avgPerDay = Math.round(total / days)
    return { total, completed, overdue, inWork, newRequests, completionRate, overdueRate, avgPerDay }
  }, [managerStats, effectiveOffice, period, startDate, endDate]);

  const handleRefresh = async () => {
    try {
      resetStats();
      setOffices([]);
      setPeriod("month");
      setOffice("all");
      setStartDate(undefined);
      setEndDate(undefined);
      await fetchStats('manager');
      await fetchOffices();
    } catch (error) {
      console.error("Ошибка при обновлении:", error);
    }
  };

  const handleLogout = async () => {
    try {
      clearAuth();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  const resetDateFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  }

  const handleExport = async (format: "xlsx" | "pbix") => {
    try {
      const params = new URLSearchParams();
      if (office && office !== 'all') params.append("office_id", String(office));
      if (startDate) params.append("from", startDate.toISOString().split('T')[0]);
      if (endDate) params.append("to", endDate.toISOString().split('T')[0]);
      params.append("format", format);

      if (window.androidApp) {
        const response = await fetch(`https://workflow-back-zpk4.onrender.com/api/analytics/export?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const blob = await response.blob();
        const reader = new FileReader();

        reader.onloadend = function() {
          const base64data = reader.result?.toString().split(',')[1] || '';
          const mimeType = blob.type ||
            (format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
              'application/octet-stream');

          window.androidApp?.saveFileBase64(
            `analytics.${format}`,
            base64data,
            mimeType
          );
        };

        reader.readAsDataURL(blob);
      } else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.saveFile) {
        const response = await fetch(`https://workflow-back-zpk4.onrender.com/api/analytics/export?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const blob = await response.blob();
        const reader = new FileReader();

        reader.onloadend = function() {
          const base64data = reader.result?.toString().split(',')[1] || '';
          const mimeType = blob.type ||
            (format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
              'application/octet-stream');

          window.webkit?.messageHandlers?.saveFile?.postMessage({
            filename: `analytics.${format}`,
            base64Data: base64data,
            mimeType: mimeType
          });
        };

        reader.readAsDataURL(blob);
      } else {
        const res = await fetch(`https://workflow-back-zpk4.onrender.com/api/analytics/export?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analytics.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Ошибка при экспорте файла:", error);
      alert("Не удалось экспортировать файл");
    }
  };

  const Stat = ({ label, value, onClick }: { label: string; value: number | string; onClick?: () => void }) => (
    <div
      className={`rounded-xl border p-4 ${isDesktop ? "bg-[#2C2C2E] border-white/10" : "bg-[#2C2C2E] border-[#3A3A3C]"} ${onClick ? "cursor-pointer transition-colors " + (isDesktop ? "hover:bg-white/5" : "hover:bg-[#353538] active:scale-[0.99]") : ""}`}
      onClick={onClick}
    >
      <div className={`text-xs font-medium ${isDesktop ? "text-white/60" : "text-[#8E8E93]"}`}>{label}</div>
      <div className={`mt-1.5 text-2xl font-semibold tracking-tight ${isDesktop ? "text-white" : "text-white"}`}>{value}</div>
    </div>
  )

  const handleTotalRequestsClick = () => {
    router.push(basePath);
  };

  const handleNewRequestsClick = () => {
    router.push(`${basePath}?status=in_progress`);
  };

  const handleInWorkRequestsClick = () => {
    router.push(`${basePath}?status=execution`);
  };

  const handleCompletedRequestsClick = () => {
    router.push(`${basePath}?status=completed`);
  };

  const handleOverdueRequestsClick = () => {
    router.push(`${basePath}?status=overdue`);
  };

  const handleNormalRequestsClick = () => {
    router.push(`${basePath}?priority=normal`);
  };

  const handleUrgentRequestsClick = () => {
    router.push(`${basePath}?priority=urgent`);
  };

  const handlePlannedRequestsClick = () => {
    router.push(`${basePath}?priority=planned`);
  };

  return (
    <>
      {!isDesktop && (
        <Header
          handleLogout={handleLogout}
          notificationCount={0}
          role="Менеджер"
        />
      )}
      <PullToRefresh onRefresh={handleRefresh}>
        <main className={`min-h-screen pb-20 ${isDesktop ? "bg-[#1A1A1A]" : "bg-[#1C1C1E] pb-[calc(80px+env(safe-area-inset-bottom,0px))]"}`}>
          {!isDesktop && (
            <div className="px-3 pt-2 pb-1">
              <Link
                href={user?.role === "admin-worker" ? basePath : `${basePath}/cabinet`}
                className="inline-flex items-center gap-1 text-[#F35713] font-medium mb-4"
              >
                <ChevronLeft className="h-5 w-5" />
                Назад
              </Link>
            </div>
          )}

          {(() => {
            const statsContent = (
              <>
          <section className="pt-3">
            <div className={`mx-auto px-3 ${isDesktop ? "max-w-6xl" : "max-w-screen-sm"}`}>
              <Card className={isDesktop ? "border border-white/10 bg-[#2C2C2E]" : "border-[#3A3A3C] bg-[#2C2C2E]"}>
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className={`flex gap-3 ${!isDesktop ? "flex-col" : "flex-row"}`}>
                    {user?.role === "manager" ? (
                      <div className="flex-1">
                        <Select value={office} onValueChange={setOffice}>
                          <SelectTrigger className={`h-10 w-full ${isDesktop ? "bg-[#1A1A1A] border-white/10 text-white" : "bg-[#2C2C2E] border-[#3A3A3C] text-white"}`}>
                            <SelectValue placeholder="Офис" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Все офисы</SelectItem>
                            {offices.map((o) => (
                              <SelectItem key={o.id} value={String(o.id)}>
                                {o.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <div className={`h-10 w-full flex items-center px-3 py-2 rounded-md text-sm ${isDesktop ? "bg-[#1A1A1A] border border-white/10 text-white" : "bg-[#2C2C2E] border border-[#3A3A3C] text-white"}`}>
                          {user?.office?.name || "Офис"}
                        </div>
                      </div>
                    )}
                    <div className="flex-1">
                      <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
                        <SelectTrigger className={`h-10 w-full ${isDesktop ? "bg-[#1A1A1A] border-white/10 text-white" : "bg-[#2C2C2E] border-[#3A3A3C] text-white"}`}>
                          <SelectValue placeholder="Период" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="week">Неделя</SelectItem>
                          <SelectItem value="month">Месяц</SelectItem>
                          <SelectItem value="year">Год</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="pt-3">
            <div className={`mx-auto px-3 ${isDesktop ? "max-w-6xl" : "max-w-screen-sm"}`}>
              <div className={`grid gap-3 ${isDesktop ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" : "grid-cols-2"}`}>
                <Stat
                  label="Всего"
                  value={summary.total}
                  onClick={handleTotalRequestsClick}
                />
                <Stat
                  label="Новые"
                  value={summary.newRequests ?? 0}
                  onClick={handleNewRequestsClick}
                />
                <Stat
                  label="В работе"
                  value={summary.inWork ?? 0}
                  onClick={handleInWorkRequestsClick}
                />
                <Stat
                  label="Завершено"
                  value={`${summary.completed} (${summary.completionRate}%)`}
                  onClick={handleCompletedRequestsClick}
                />
                <Stat
                  label="Просрочено"
                  value={`${summary.overdue} (${summary.overdueRate}%)`}
                  onClick={handleOverdueRequestsClick}
                />
                <Stat label="В день (ср.)" value={summary.avgPerDay} />
              </div>
            </div>
          </section>

          <section className="pt-3">
            <div className={`mx-auto px-3 ${isDesktop ? "max-w-6xl" : "max-w-screen-sm"}`}>
              <Card className={isDesktop ? "border border-white/10 bg-[#2C2C2E]" : "border-[#3A3A3C] bg-[#2C2C2E]"}>
                <CardContent className="p-4 md:p-6">
                  <div className="mb-4">
                    <div className={`text-sm font-medium ${isDesktop ? "text-white" : "text-white"}`}>Динамика по дням</div>
                    <div className={`text-xs mt-0.5 ${isDesktop ? "text-white/60" : "text-[#8E8E93]"}`}>Количество заявок по дням</div>
                  </div>

                  <div className="mb-4 space-y-3">
                    <div className={`flex items-center gap-2 flex-wrap ${isDesktop ? "flex-row" : ""}`}>
                      <Label className={`text-sm font-medium ${isDesktop ? "text-white/80" : "text-[#8E8E93]"}`}>Фильтр по дате:</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetDateFilters}
                        className={isDesktop ? "bg-transparent text-white hover:bg-white/10" : "border-[#3A3A3C] text-white hover:bg-white/10"}
                      >
                        Сбросить
                      </Button>
                    </div>

                    <div className={`grid gap-2 ${isDesktop ? "grid-cols-2 sm:grid-cols-2 max-w-xs" : "grid-cols-2"}`}>
                      <div>
                        <Label className={`text-xs ${isDesktop ? "text-white/70" : "text-[#8E8E93]"}`}>От:</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={`w-full justify-start text-left font-normal ${isDesktop ? "border-white/10 bg-[#1A1A1A] text-white hover:bg-white/10" : "border-[#3A3A3C] bg-[#2C2C2E] text-white hover:bg-white/10"}`}
                            >
                              <CalendarLucid className="mr-2 h-4 w-4" />
                              {startDate ? format(startDate, "dd.MM", { locale: ru }) : "От"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div>
                        <Label className={`text-xs ${isDesktop ? "text-white/70" : "text-[#8E8E93]"}`}>До:</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={`w-full justify-start text-left font-normal ${isDesktop ? "border-white/10 bg-[#1A1A1A] text-white hover:bg-white/10" : "border-[#3A3A3C] bg-[#2C2C2E] text-white hover:bg-white/10"}`}
                            >
                              <CalendarLucid className="mr-2 h-4 w-4" />
                              {endDate ? format(endDate, "dd.MM", { locale: ru }) : "До"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              disabled={(date) => startDate ? date < startDate : false}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>

                  <div className={isDesktop ? "h-64" : "h-48"}>
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <defs>
                            <linearGradient id="kcellGradientStats" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#E85D2B" stopOpacity={1} />
                              <stop offset="100%" stopColor="#E85D2B" stopOpacity={0.4} />
                            </linearGradient>
                          </defs>

                          <CartesianGrid strokeDasharray="3 3" stroke={isDesktop ? "rgba(255,255,255,0.1)" : "#3A3A3C"} />
                          <XAxis dataKey="date" stroke={isDesktop ? "#8E8E93" : "#8E8E93"} tick={{ fill: isDesktop ? "#8E8E93" : "#8E8E93" }} />
                          <YAxis allowDecimals={false} stroke="#8E8E93" tick={{ fill: "#8E8E93" }} />
                          <Tooltip contentStyle={{ background: "#2C2C2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} labelStyle={{ color: "#fff" }} />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke="url(#kcellGradientStats)"
                            strokeWidth={2.5}
                            dot={{ r: 4, stroke: "#E85D2B", strokeWidth: 1.5, fill: "#1A1A1A" }}
                            activeDot={{ r: 6, fill: "#E85D2B" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className={`text-center py-16 ${isDesktop ? "text-white/50" : "text-[#8E8E93]"}`}>Нет данных для отображения</div>
                    )}
                  </div>

                  <div className={`mt-4 pt-4 border-t ${isDesktop ? "border-white/10" : "border-[#3A3A3C]"}`}>
                    <div className={`text-sm font-medium mb-3 ${isDesktop ? "text-white" : "text-white"}`}>Экспорт данных</div>
                    <div className={`flex gap-2 ${isDesktop ? "flex-row" : "flex-col"}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`flex-1 w-full ${isDesktop ? "bg-transparent border-white/10 text-white hover:bg-[#E85D2B] hover:border-[#E85D2B]" : "border-[#3A3A3C] text-white hover:bg-white/10"}`}
                        onClick={() => handleExport("xlsx")}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Excel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`flex-1 w-full ${isDesktop ? "bg-transparent  border-white/10 text-white hover:bg-[#E85D2B] hover:border-[#E85D2B]" : "border-[#3A3A3C] text-white hover:bg-white/10"}`}
                        onClick={() => handleExport("pbix")}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Power BI
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="pt-3">
            <div className={`mx-auto px-3 ${isDesktop ? "max-w-6xl" : "max-w-screen-sm"}`}>
              <Card className={isDesktop ? "border border-white/10 bg-[#2C2C2E]" : "border-[#3A3A3C] bg-[#2C2C2E]"}>
                <CardContent className="p-4 md:p-6">
                  <div className="mb-3">
                    <div className="text-sm font-medium text-white">Краткий обзор</div>
                    <div className={`text-xs mt-0.5 ${isDesktop ? "text-white/60" : "text-[#8E8E93]"}`}>
                      Всего заявок: {summary.total}, в работе: {summary.inWork}, выполнено: {summary.completed} ({summary.completionRate}%), просрочено: {summary.overdue} ({summary.overdueRate}%)
                    </div>
                  </div>
                  {distribution && (
                    <div className={`space-y-3 ${isDesktop ? "grid sm:grid-cols-3 gap-4" : ""}`}>
                      {[
                        {
                          key: "normal",
                          label: "Обычные",
                          pctKey: "normalPercent",
                          icon: <BarChart3 className={`h-4 w-4 ${isDesktop ? "text-[#E85D2B]" : "text-[#114A65]"}`} />,
                        },
                        {
                          key: "urgent",
                          label: "Экстренные",
                          pctKey: "urgentPercent",
                          icon: <AlertTriangle className={`h-4 w-4 ${isDesktop ? "text-[#E85D2B]" : "text-[#B8400E]"}`} />,
                        },
                        {
                          key: "planned",
                          label: "Плановые",
                          pctKey: "plannedPercent",
                          icon: <CalendarLucid className={`h-4 w-4 ${isDesktop ? "text-[#E85D2B]" : "text-[#114A65]"}`} />,
                        },
                      ].map((row) => {
                        const totalKey = row.key as "normal" | "urgent" | "planned"
                        const pctKey = row.pctKey as "normalPercent" | "urgentPercent" | "plannedPercent"
                        return (
                          <div key={row.key} className="space-y-2">
                            <div
                              className={`flex items-center justify-between text-sm cursor-pointer rounded-lg p-2 transition-colors ${isDesktop ? "hover:bg-white/5" : "hover:bg-white/10 active:scale-[0.99]"}`}
                              onClick={() => {
                                if (row.key === "normal") {
                                  handleNormalRequestsClick();
                                } else if (row.key === "urgent") {
                                  handleUrgentRequestsClick();
                                } else if (row.key === "planned") {
                                  handlePlannedRequestsClick();
                                }
                              }}
                            >
                              <div className="flex items-center gap-2 text-white">
                                {row.icon}
                                <span>{row.label}</span>
                              </div>
                              <span className="font-medium text-white">
                                {distribution[totalKey]} ({distribution[pctKey]}%)
                              </span>
                            </div>
                            <div className={`h-2 w-full overflow-hidden rounded ${isDesktop ? "bg-white/10" : "bg-[#3A3A3C]"}`}>
                              <div
                                className={`h-full transition-all ${isDesktop ? "bg-[#E85D2B]" : "bg-gradient-to-r from-[#114A65] to-[#B8400E]"}`}
                                style={{ width: `${distribution[pctKey]}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

              </>
            );
            return isDesktop ? (
              <Tabs defaultValue="stats" className="w-full px-4 pt-4">
                <TabsList className="w-full justify-start rounded-xl bg-[#2C2C2E]/80 border border-white/10 p-1.5 gap-1 h-auto min-h-0 mb-4">
                  <TabsTrigger value="stats" className="rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 data-[state=active]:bg-[#E85D2B] data-[state=active]:text-white data-[state=inactive]:text-white/60 data-[state=inactive]:hover:bg-white/5 data-[state=inactive]:hover:text-white/90">Статистика</TabsTrigger>
                  <TabsTrigger value="analytics" className="rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 data-[state=active]:bg-[#E85D2B] data-[state=active]:text-white data-[state=inactive]:text-white/60 data-[state=inactive]:hover:bg-white/5 data-[state=inactive]:hover:text-white/90">Аналитика</TabsTrigger>
                  <TabsTrigger value="workload" className="rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 data-[state=active]:bg-[#E85D2B] data-[state=active]:text-white data-[state=inactive]:text-white/60 data-[state=inactive]:hover:bg-white/5 data-[state=inactive]:hover:text-white/90">Загрузка</TabsTrigger>
                </TabsList>
                <TabsContent value="stats" className="mt-0">
                  <div className="w-full">{statsContent}</div>
                </TabsContent>
                <TabsContent value="analytics" className="mt-0">
                  <ManagerAnalytics />
                </TabsContent>
                <TabsContent value="workload" className="mt-0">
                  <MeetingRoomStatistics variant="dark" defaultShowCalendar />
                </TabsContent>
              </Tabs>
            ) : statsContent;
          })()}
        </main>
      </PullToRefresh>
      {!isDesktop && <BottomNav
        activeTab="statistics"
        hidden={false}
      />}
    </>
  )
}

