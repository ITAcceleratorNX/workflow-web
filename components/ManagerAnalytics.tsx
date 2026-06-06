"use client"

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsListScrollArea, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Clock, Star, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import api from "@/lib/api";
import { useIsDesktop } from "@/hooks/use-media-query";
import { MeetingRoomStatistics } from "@/components/meeting-rooms/MeetingRoomStatistics";

interface SLAStats {
  byDate: Array<{
    date: string;
    avgHours: string;
    totalCompleted: number;
  }>;
  byCategory: Array<{
    categoryId: number;
    avgHours: string;
    totalCompleted: number;
  }>;
  byOffice: Array<{
    officeId: number;
    avgHours: string;
    totalCompleted: number;
  }>;
}

interface RatingStats {
  byOffice: Array<{
    officeId: number;
    avgRating: string;
    totalRatings: number;
    lowRatings: number;
  }>;
  byCategory: Array<{
    categoryId: number;
    avgRating: string;
    totalRatings: number;
    lowRatings: number;
  }>;
  byExecutor: Array<{
    executorId: number;
    avgRating: string;
    totalRatings: number;
    lowRatings: number;
  }>;
  byClient: Array<{
    clientId: number;
    avgRating: string;
    totalRatings: number;
    lowRatings: number;
  }>;
  byDate: Array<{
    date: string;
    avgRating: string;
    totalRatings: number;
    lowRatings: number;
  }>;
}

interface DetailedStats {
  byCategory: Array<{
    categoryId: number;
    totalRequests: number;
    completedRequests: number;
    newRequests: number;
    inWorkRequests: number;
  }>;
  byDirection: Array<{
    directionId: number;
    totalRequests: number;
    completedRequests: number;
    newRequests: number;
    inWorkRequests: number;
  }>;
  byExecutor: Array<{
    executorId: number;
    totalAssigned: number;
    completedRequests: number;
    inWorkRequests: number;
  }>;
}

const COLORS = ['#E85D2B', '#E85D2B', '#E85D2B', '#E85D2B', '#E85D2B'];
const COLORS_DARK = ['#E85D2B', '#f07a4a', '#f4976d', '#f8b490', '#fcd1b3'];

const CHART_TICK = { fill: "#8E8E93" };
const CHART_GRID = "rgba(255,255,255,0.1)";
const CHART_TOOLTIP = { background: "#2C2C2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 };
const CHART_LABEL = { color: "#fff" };

export default function ManagerAnalytics() {
  const [slaStats, setSlaStats] = useState<SLAStats | null>(null);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [detailedStats, setDetailedStats] = useState<DetailedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("sla");
  const [categories, setCategories] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [executors, setExecutors] = useState<any[]>([]);
  const isDesktop = useIsDesktop();

  const cardCl = isDesktop ? "rounded-xl border border-white/10 bg-[#2C2C2E]" : "rounded-xl border-[#3A3A3C] bg-[#2C2C2E]";
  const titleCl = isDesktop ? "text-white" : "text-white";
  const descCl = isDesktop ? "text-white/60" : "text-[#8E8E93]";
  const chartStroke = isDesktop ? "#E85D2B" : "#8884d8";
  const chartFill = isDesktop ? "#E85D2B" : "#8884d8";

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [slaRes, ratingRes, detailedRes, categoriesRes, officesRes, executorsRes] = await Promise.all([
        api.get("/analytics/stats/manager/sla"),
        api.get("/analytics/stats/manager/ratings"),
        api.get("/analytics/stats/manager/detailed"),
        api.get("/service-categories"),
        api.get("/offices"),
        api.get("/executors/all")
      ]);

      console.log("Загруженные данные:", {
        categories: categoriesRes.data,
        offices: officesRes.data,
        executors: executorsRes.data,
        detailedStats: detailedRes.data
      });

      // Детальное логирование для отладки
      console.log("Категории:", categoriesRes.data);
      console.log("Офисы:", officesRes.data);
      console.log("Исполнители:", executorsRes.data);
      console.log("Детальная статистика:", detailedRes.data);
      
      if (detailedRes.data?.byCategory) {
        console.log("Категории в статистике:", detailedRes.data.byCategory);
        detailedRes.data.byCategory.forEach((item: any) => {
          console.log(`Категория ID ${item.categoryId}:`, item);
        });
      }
      
      if (detailedRes.data?.byExecutor) {
        console.log("Исполнители в статистике:", detailedRes.data.byExecutor);
        detailedRes.data.byExecutor.forEach((item: any) => {
          console.log(`Исполнитель ID ${item.executorId}:`, item);
        });
      }

      setSlaStats(slaRes.data);
      setRatingStats(ratingRes.data);
      setDetailedStats(detailedRes.data);
      setCategories(categoriesRes.data);
      setOffices(officesRes.data);
      setExecutors(executorsRes.data);
    } catch (error) {
      console.error("Ошибка при загрузке аналитики:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, delta, positive = true, bg }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    delta?: string;
    positive?: boolean;
    bg: string;
  }) => (
    <Card className={`min-w-0 rounded-xl ${cardCl}`}>
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className={`p-2 rounded-xl flex-shrink-0 ${isDesktop ? "bg-[#E85D2B]/20 [&_svg]:text-[#E85D2B]" : "bg-white/10"}`}>{icon}</div>
          <div className="ml-3 min-w-0 flex-1">
            <p className={`text-sm truncate ${descCl}`}>{title}</p>
            <p className="text-xl font-bold truncate text-white">{value}</p>
            {delta && (
              <div className="flex items-center text-xs mt-1">
                {positive ? (
                  <TrendingUp className={`w-3 h-3 mr-1 ${isDesktop ? "text-[#E85D2B]" : "text-green-400"}`} />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1 text-red-400" />
                )}
                <span className={positive ? (isDesktop ? "text-[#E85D2B]" : "text-green-400") : "text-red-400"}>{delta}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const getCategoryName = (categoryId: number) => {
    if (!categories.length) return `Категория ${categoryId}`;
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : `Категория ${categoryId}`;
  };

  const getOfficeName = (officeId: number) => {
    if (!offices.length) return `Офис ${officeId}`;
    const office = offices.find(off => off.id === officeId);
    return office ? office.name : `Офис ${officeId}`;
  };

  const getExecutorName = (executorId: number) => {
    if (!executors.length) return `Исполнитель ${executorId}`;
    const executor = executors.find(exec => exec.id === executorId);
    return executor ? (executor.user?.full_name || `Исполнитель ${executorId}`) : `Исполнитель ${executorId}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={isDesktop ? "text-white/60" : "text-[#8E8E93]"}>Загрузка аналитики...</div>
      </div>
    );
  }

  // Проверяем, загружены ли все необходимые данные
  const isDataReady = categories.length > 0 && offices.length > 0 && executors.length > 0;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="w-full mb-3 min-w-0">
          <TabsListScrollArea>
            <TabsList className={`flex flex-nowrap flex-shrink-0 gap-2 rounded-xl border border-[#3A3A3C] bg-[#2C2C2E]/80 p-1 min-w-0 ${isDesktop ? "bg-[#2C2C2E] border-white/10 p-1.5 [&>button]:flex-shrink-0 [&>button]:whitespace-nowrap" : ""}`}>
              <TabsTrigger value="sla" className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 truncate ${isDesktop ? "data-[state=active]:bg-[#E85D2B] data-[state=active]:text-white data-[state=inactive]:text-white/60 data-[state=inactive]:hover:bg-white/5" : "text-xs px-3 py-2 whitespace-nowrap flex-shrink-0 data-[state=active]:bg-[#F35713] data-[state=active]:text-white data-[state=inactive]:text-[#8E8E93]"}`}>
                SLA
              </TabsTrigger>
              <TabsTrigger value="ratings" className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 truncate ${isDesktop ? "data-[state=active]:bg-[#E85D2B] data-[state=active]:text-white data-[state=inactive]:text-white/60 data-[state=inactive]:hover:bg-white/5" : "text-xs px-3 py-2 whitespace-nowrap flex-shrink-0 data-[state=active]:bg-[#F35713] data-[state=active]:text-white data-[state=inactive]:text-[#8E8E93]"}`}>
                Оценки
              </TabsTrigger>
              <TabsTrigger value="detailed" className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 truncate ${isDesktop ? "data-[state=active]:bg-[#E85D2B] data-[state=active]:text-white data-[state=inactive]:text-white/60 data-[state=inactive]:hover:bg-white/5" : "text-xs px-3 py-2 whitespace-nowrap flex-shrink-0 data-[state=active]:bg-[#F35713] data-[state=active]:text-white data-[state=inactive]:text-[#8E8E93]"}`}>
                {isDesktop ? "Детальная статистика" : "Детальная"}
              </TabsTrigger>
            </TabsList>
          </TabsListScrollArea>
        </div>

        <TabsContent value="sla" className="space-y-6">
          <div className={`grid gap-4 ${isDesktop ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            <StatCard
              title="Всего завершено"
              value={slaStats?.byDate.reduce((sum, item) => sum + item.totalCompleted, 0) || 0}
              icon={<BarChart3 className="w-4 h-4 text-green-600" />}
              bg="bg-green-100"
            />
            <StatCard
              title="Категорий"
              value={slaStats?.byCategory.length || 0}
              icon={<AlertTriangle className="w-4 h-4 text-orange-600" />}
              bg="bg-orange-100"
            />
          </div>

          <div className={`grid gap-6 ${isDesktop ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 gap-4"}`}>
            <Card className={cardCl}>
              <CardHeader>
                <CardTitle className={`text-lg ${titleCl}`}>Динамика SLA по времени</CardTitle>
                <CardDescription className={`text-sm ${descCl}`}>Среднее время выполнения заявок по дням</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={isDesktop ? "h-64" : "h-48"}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={slaStats?.byDate || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDesktop ? CHART_GRID : "#3A3A3C"} />
                      <XAxis dataKey="date" tick={CHART_TICK} />
                      <YAxis tick={CHART_TICK} />
                      <Tooltip contentStyle={CHART_TOOLTIP} labelStyle={CHART_LABEL} />
                      <Line type="monotone" dataKey="avgHours" stroke={chartStroke} strokeWidth={2} dot={{ fill: chartFill }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className={cardCl}>
              <CardHeader>
                <CardTitle className={`text-lg ${titleCl}`}>SLA по категориям</CardTitle>
                <CardDescription className={`text-sm ${descCl}`}>Среднее время выполнения по категориям заявок</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={isDesktop ? "h-64" : "h-48"}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={slaStats?.byCategory.map(item => ({
                      ...item,
                      categoryName: getCategoryName(item.categoryId)
                    })) || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDesktop ? CHART_GRID : "#3A3A3C"} />
                      <XAxis dataKey="categoryName" tick={CHART_TICK} />
                      <YAxis tick={CHART_TICK} />
                      <Tooltip formatter={(value, name) => [value, name === "avgHours" ? "Средние часы" : name]} contentStyle={CHART_TOOLTIP} labelStyle={CHART_LABEL} />
                      <Bar dataKey="avgHours" fill={chartFill} name="Средние часы" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ratings" className="space-y-6">
          <div className={`grid gap-4 ${isDesktop ? "grid-cols-1 md:grid-cols-4" : "grid-cols-2 gap-3"}`}>
            <StatCard
              title="Средняя оценка"
              value={ratingStats?.byDate.length ? ratingStats.byDate[ratingStats.byDate.length - 1]?.avgRating || "0" : "0"}
              icon={<Star className="w-4 h-4 text-yellow-600" />}
              bg="bg-yellow-100"
            />
            <StatCard
              title="Всего оценок"
              value={ratingStats?.byDate.reduce((sum, item) => sum + item.totalRatings, 0) || 0}
              icon={<BarChart3 className="w-4 h-4 text-blue-600" />}
              bg="bg-blue-100"
            />
            <StatCard
              title="Низкие оценки (1-2)"
              value={ratingStats?.byDate.reduce((sum, item) => sum + item.lowRatings, 0) || 0}
              icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
              bg="bg-red-100"
            />
            <StatCard
              title="Офисов"
              value={ratingStats?.byOffice.length || 0}
              icon={<BarChart3 className="w-4 h-4 text-green-600" />}
              bg="bg-green-100"
            />
          </div>

          <div className={`grid gap-6 ${isDesktop ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 gap-4"}`}>
            <Card className={cardCl}>
              <CardHeader>
                <CardTitle className={`text-lg ${titleCl}`}>Динамика оценок</CardTitle>
                <CardDescription className={`text-sm ${descCl}`}>Средние оценки по времени</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={isDesktop ? "h-64" : "h-48"}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ratingStats?.byDate || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDesktop ? CHART_GRID : "#3A3A3C"} />
                      <XAxis dataKey="date" tick={CHART_TICK} />
                      <YAxis tick={CHART_TICK} />
                      <Tooltip contentStyle={CHART_TOOLTIP} labelStyle={CHART_LABEL} />
                      <Line type="monotone" dataKey="avgRating" stroke={chartStroke} strokeWidth={2} dot={{ fill: chartFill }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className={cardCl}>
              <CardHeader>
                <CardTitle className={`text-lg ${titleCl}`}>Низкие оценки по офисам</CardTitle>
                <CardDescription className={`text-sm ${descCl}`}>Количество оценок 1-2 по офисам</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={isDesktop ? "h-64" : "h-48"}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ratingStats?.byOffice.map(item => ({
                      ...item,
                      officeName: isDataReady ? getOfficeName(item.officeId) : `Офис ${item.officeId}`
                    })) || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDesktop ? CHART_GRID : "#3A3A3C"} />
                      <XAxis dataKey="officeName" tick={CHART_TICK} />
                      <YAxis tick={CHART_TICK} />
                      <Tooltip formatter={(value, name) => [value, name === "lowRatings" ? "Низкие оценки" : name]} contentStyle={CHART_TOOLTIP} labelStyle={CHART_LABEL} />
                      <Bar dataKey="lowRatings" fill={isDesktop ? "#E85D2B" : "#ff6b6b"} name="Низкие оценки" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className={cardCl}>
            <CardHeader>
              <CardTitle className={`text-lg ${titleCl}`}>Оценки по категориям</CardTitle>
              <CardDescription className={`text-sm ${descCl}`}>Средние оценки и количество низких оценок</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`grid gap-4 ${isDesktop ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {!isDataReady && (
                  <div className={`col-span-full text-center py-4 ${descCl}`}>
                    Загрузка данных...
                  </div>
                )}
                {ratingStats?.byCategory.map((item) => (
                  <div key={item.categoryId} className={`p-4 border rounded-xl ${isDesktop ? "border-white/10 bg-[#1A1A1A]/50" : "border-[#3A3A3C]"}`}>
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <span className={`font-medium truncate min-w-0 text-sm ${titleCl}`}>
                        {isDataReady ? getCategoryName(item.categoryId) : `Категория ${item.categoryId}`}
                      </span>
                      <Badge variant="outline" className={`flex-shrink-0 ${isDesktop ? "border-[#E85D2B]/50 text-[#E85D2B]" : "text-xs border-[#3A3A3C] text-white"}`}>{item.avgRating}</Badge>
                    </div>
                    <div className={`text-xs ${descCl}`}>
                      <div>Всего оценок: {item.totalRatings}</div>
                      <div className="text-red-400">Низких оценок: {item.lowRatings}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          <div className={`grid gap-4 ${isDesktop ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'}`}>
            <StatCard
              title="Категорий"
              value={detailedStats?.byCategory.length || 0}
              icon={<BarChart3 className="w-4 h-4 text-blue-600" />}
              bg="bg-blue-100"
            />
            <StatCard
              title="Направлений"
              value={detailedStats?.byDirection.length || 0}
              icon={<BarChart3 className="w-4 h-4 text-green-600" />}
              bg="bg-green-100"
            />
            <StatCard
              title="Исполнителей"
              value={detailedStats?.byExecutor.length || 0}
              icon={<BarChart3 className="w-4 h-4 text-[#114A65]" />}
              bg="bg-[#114A65]/10"
            />
          </div>

          <div className={`grid gap-6 ${isDesktop ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 gap-4"}`}>
            <Card className={cardCl}>
              <CardHeader>
                <CardTitle className={`text-lg ${titleCl}`}>Статистика по категориям</CardTitle>
                <CardDescription className={`text-sm ${descCl}`}>Распределение заявок по категориям</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={isDesktop ? 'h-64' : 'h-48'}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={detailedStats?.byCategory.map(item => ({
                          ...item,
                          categoryName: isDataReady ? getCategoryName(item.categoryId) : `Категория ${item.categoryId}`
                        })) || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ categoryName, totalRequests }) => `${categoryName}: ${totalRequests}`}
                        outerRadius={isDesktop ? 80 : 60}
                        fill={chartFill}
                        dataKey="totalRequests"
                      >
                        {(detailedStats?.byCategory || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={isDesktop ? COLORS_DARK[index % COLORS_DARK.length] : COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={CHART_TOOLTIP} labelStyle={CHART_LABEL} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className={cardCl}>
              <CardHeader>
                <CardTitle className={`text-lg ${titleCl}`}>Статистика по исполнителям</CardTitle>
                <CardDescription className={`text-sm ${descCl}`}>Количество назначенных и завершенных заявок</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={isDesktop ? 'h-64' : 'h-48'}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={detailedStats?.byExecutor.map(item => ({
                      ...item,
                      executorName: isDataReady ? getExecutorName(item.executorId) : `Исполнитель ${item.executorId}`
                    })) || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDesktop ? CHART_GRID : "#3A3A3C"} />
                      <XAxis dataKey="executorName" tick={CHART_TICK} />
                      <YAxis tick={CHART_TICK} />
                      <Tooltip formatter={(value, name) => [
                        value,
                        name === "totalAssigned" ? "Назначено" : name === "completedRequests" ? "Завершено" : name
                      ]} contentStyle={CHART_TOOLTIP} labelStyle={CHART_LABEL} />
                      <Bar dataKey="totalAssigned" fill={chartFill} name="Назначено" />
                      <Bar dataKey="completedRequests" fill={isDesktop ? "#f07a4a" : "#82ca9d"} name="Завершено" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className={cardCl}>
            <CardHeader>
              <CardTitle className={`text-lg ${titleCl}`}>Детальная статистика по категориям</CardTitle>
              <CardDescription className={`text-sm ${descCl}`}>Полная информация по каждой категории</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`grid gap-4 ${isDesktop ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {!isDataReady && (
                  <div className={`col-span-full text-center py-4 ${descCl}`}>
                    Загрузка данных...
                  </div>
                )}
                {detailedStats?.byCategory.map((item) => (
                  <div key={item.categoryId} className={`p-4 border rounded-xl ${isDesktop ? "border-white/10 bg-[#1A1A1A]/50" : "border-[#3A3A3C]"}`}>
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <span className={`font-medium truncate min-w-0 text-sm ${titleCl}`}>
                        {isDataReady ? getCategoryName(item.categoryId) : `Категория ${item.categoryId}`}
                      </span>
                      <Badge variant="outline" className={`flex-shrink-0 ${isDesktop ? "border-[#E85D2B]/50 text-[#E85D2B]" : "text-xs border-[#3A3A3C] text-white"}`}>{item.totalRequests}</Badge>
                    </div>
                    <div className={`space-y-1 text-xs ${descCl}`}>
                      <div>Завершено: {item.completedRequests}</div>
                      <div>Новые: {item.newRequests}</div>
                      <div>В работе: {item.inWorkRequests}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {
        !isDesktop && (
              <div className="mt-8">
                <MeetingRoomStatistics variant={"dark"} />
              </div>
          )
      }
    </div>
  );
}
