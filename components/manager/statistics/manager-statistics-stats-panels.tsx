"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  AlertTriangle,
  BarChart3,
  Calendar as CalendarLucid,
  Download,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UseManagerStatisticsPageResult } from "@/hooks/use-manager-statistics-page";

type ManagerStatisticsStatsPanelsProps = UseManagerStatisticsPageResult & {
  isDesktop: boolean;
};

function Stat({
  label,
  value,
  onClick,
  isDesktop,
}: {
  label: string;
  value: number | string;
  onClick?: () => void;
  isDesktop: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${isDesktop ? "bg-[#2C2C2E] border-white/10" : "bg-[#2C2C2E] border-[#3A3A3C]"} ${onClick ? "cursor-pointer transition-colors " + (isDesktop ? "hover:bg-white/5" : "hover:bg-[#353538] active:scale-[0.99]") : ""}`}
      onClick={onClick}
    >
      <div className={`text-xs font-medium ${isDesktop ? "text-white/60" : "text-[#8E8E93]"}`}>
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-semibold tracking-tight text-white">{value}</div>
    </div>
  );
}

export function ManagerStatisticsStatsPanels({
  isDesktop,
  user,
  period,
  setPeriod,
  office,
  setOffice,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  offices,
  chartData,
  distribution,
  summary,
  resetDateFilters,
  handleExport,
  handleTotalRequestsClick,
  handleNewRequestsClick,
  handleInWorkRequestsClick,
  handleCompletedRequestsClick,
  handleOverdueRequestsClick,
  handleNormalRequestsClick,
  handleUrgentRequestsClick,
  handlePlannedRequestsClick,
}: ManagerStatisticsStatsPanelsProps) {
  return (
    <>
      <section className="pt-3">
        <div className={`mx-auto px-3 ${isDesktop ? "max-w-6xl" : "max-w-screen-sm"}`}>
          <Card
            className={
              isDesktop ? "border border-white/10 bg-[#2C2C2E]" : "border-[#3A3A3C] bg-[#2C2C2E]"
            }
          >
            <CardContent className="flex flex-col gap-3 p-4">
              <div className={`flex gap-3 ${!isDesktop ? "flex-col" : "flex-row"}`}>
                {user?.role === "manager" ? (
                  <div className="flex-1">
                    <Select value={office} onValueChange={setOffice}>
                      <SelectTrigger
                        className={`h-10 w-full ${isDesktop ? "bg-[#1A1A1A] border-white/10 text-white" : "bg-[#2C2C2E] border-[#3A3A3C] text-white"}`}
                      >
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
                    <div
                      className={`h-10 w-full flex items-center px-3 py-2 rounded-md text-sm ${isDesktop ? "bg-[#1A1A1A] border border-white/10 text-white" : "bg-[#2C2C2E] border border-[#3A3A3C] text-white"}`}
                    >
                      {user?.office?.name || "Офис"}
                    </div>
                  </div>
                )}
                <div className="flex-1">
                  <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
                    <SelectTrigger
                      className={`h-10 w-full ${isDesktop ? "bg-[#1A1A1A] border-white/10 text-white" : "bg-[#2C2C2E] border-[#3A3A3C] text-white"}`}
                    >
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
          <div
            className={`grid gap-3 ${isDesktop ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" : "grid-cols-2"}`}
          >
            <Stat
              label="Всего"
              value={summary.total}
              onClick={handleTotalRequestsClick}
              isDesktop={isDesktop}
            />
            <Stat
              label="Новые"
              value={summary.newRequests ?? 0}
              onClick={handleNewRequestsClick}
              isDesktop={isDesktop}
            />
            <Stat
              label="В работе"
              value={summary.inWork ?? 0}
              onClick={handleInWorkRequestsClick}
              isDesktop={isDesktop}
            />
            <Stat
              label="Завершено"
              value={`${summary.completed} (${summary.completionRate}%)`}
              onClick={handleCompletedRequestsClick}
              isDesktop={isDesktop}
            />
            <Stat
              label="Просрочено"
              value={`${summary.overdue} (${summary.overdueRate}%)`}
              onClick={handleOverdueRequestsClick}
              isDesktop={isDesktop}
            />
            <Stat label="В день (ср.)" value={summary.avgPerDay} isDesktop={isDesktop} />
          </div>
        </div>
      </section>

      <section className="pt-3">
        <div className={`mx-auto px-3 ${isDesktop ? "max-w-6xl" : "max-w-screen-sm"}`}>
          <Card
            className={
              isDesktop ? "border border-white/10 bg-[#2C2C2E]" : "border-[#3A3A3C] bg-[#2C2C2E]"
            }
          >
            <CardContent className="p-4 md:p-6">
              <div className="mb-4">
                <div className="text-sm font-medium text-white">Динамика по дням</div>
                <div className={`text-xs mt-0.5 ${isDesktop ? "text-white/60" : "text-[#8E8E93]"}`}>
                  Количество заявок по дням
                </div>
              </div>

              <div className="mb-4 space-y-3">
                <div className={`flex items-center gap-2 flex-wrap ${isDesktop ? "flex-row" : ""}`}>
                  <Label
                    className={`text-sm font-medium ${isDesktop ? "text-white/80" : "text-[#8E8E93]"}`}
                  >
                    Фильтр по дате:
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetDateFilters}
                    className={
                      isDesktop
                        ? "bg-transparent text-white hover:bg-white/10"
                        : "border-[#3A3A3C] text-white hover:bg-white/10"
                    }
                  >
                    Сбросить
                  </Button>
                </div>

                <div
                  className={`grid gap-2 ${isDesktop ? "grid-cols-2 sm:grid-cols-2 max-w-xs" : "grid-cols-2"}`}
                >
                  <div>
                    <Label
                      className={`text-xs ${isDesktop ? "text-white/70" : "text-[#8E8E93]"}`}
                    >
                      От:
                    </Label>
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
                    <Label
                      className={`text-xs ${isDesktop ? "text-white/70" : "text-[#8E8E93]"}`}
                    >
                      До:
                    </Label>
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
                          disabled={(date) => (startDate ? date < startDate : false)}
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
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDesktop ? "rgba(255,255,255,0.1)" : "#3A3A3C"}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="#8E8E93"
                        tick={{ fill: "#8E8E93" }}
                      />
                      <YAxis allowDecimals={false} stroke="#8E8E93" tick={{ fill: "#8E8E93" }} />
                      <Tooltip
                        contentStyle={{
                          background: "#2C2C2E",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 8,
                        }}
                        labelStyle={{ color: "#fff" }}
                      />
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
                  <div
                    className={`text-center py-16 ${isDesktop ? "text-white/50" : "text-[#8E8E93]"}`}
                  >
                    Нет данных для отображения
                  </div>
                )}
              </div>

              <div
                className={`mt-4 pt-4 border-t ${isDesktop ? "border-white/10" : "border-[#3A3A3C]"}`}
              >
                <div className="text-sm font-medium mb-3 text-white">Экспорт данных</div>
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
          <Card
            className={
              isDesktop ? "border border-white/10 bg-[#2C2C2E]" : "border-[#3A3A3C] bg-[#2C2C2E]"
            }
          >
            <CardContent className="p-4 md:p-6">
              <div className="mb-3">
                <div className="text-sm font-medium text-white">Краткий обзор</div>
                <div className={`text-xs mt-0.5 ${isDesktop ? "text-white/60" : "text-[#8E8E93]"}`}>
                  Всего заявок: {summary.total}, в работе: {summary.inWork}, выполнено:{" "}
                  {summary.completed} ({summary.completionRate}%), просрочено: {summary.overdue} (
                  {summary.overdueRate}%)
                </div>
              </div>
              {distribution && (
                <div className={`space-y-3 ${isDesktop ? "grid sm:grid-cols-3 gap-4" : ""}`}>
                  {[
                    {
                      key: "normal" as const,
                      label: "Обычные",
                      pctKey: "normalPercent" as const,
                      icon: (
                        <BarChart3
                          className={`h-4 w-4 ${isDesktop ? "text-[#E85D2B]" : "text-[#114A65]"}`}
                        />
                      ),
                      onClick: handleNormalRequestsClick,
                    },
                    {
                      key: "urgent" as const,
                      label: "Экстренные",
                      pctKey: "urgentPercent" as const,
                      icon: (
                        <AlertTriangle
                          className={`h-4 w-4 ${isDesktop ? "text-[#E85D2B]" : "text-[#B8400E]"}`}
                        />
                      ),
                      onClick: handleUrgentRequestsClick,
                    },
                    {
                      key: "planned" as const,
                      label: "Плановые",
                      pctKey: "plannedPercent" as const,
                      icon: (
                        <CalendarLucid
                          className={`h-4 w-4 ${isDesktop ? "text-[#E85D2B]" : "text-[#114A65]"}`}
                        />
                      ),
                      onClick: handlePlannedRequestsClick,
                    },
                  ].map((row) => (
                    <div key={row.key} className="space-y-2">
                      <div
                        className={`flex items-center justify-between text-sm cursor-pointer rounded-lg p-2 transition-colors ${isDesktop ? "hover:bg-white/5" : "hover:bg-white/10 active:scale-[0.99]"}`}
                        onClick={row.onClick}
                      >
                        <div className="flex items-center gap-2 text-white">
                          {row.icon}
                          <span>{row.label}</span>
                        </div>
                        <span className="font-medium text-white">
                          {distribution[row.key]} ({distribution[row.pctKey]}%)
                        </span>
                      </div>
                      <div
                        className={`h-2 w-full overflow-hidden rounded ${isDesktop ? "bg-white/10" : "bg-[#3A3A3C]"}`}
                      >
                        <div
                          className={`h-full transition-all ${isDesktop ? "bg-[#E85D2B]" : "bg-gradient-to-r from-[#114A65] to-[#B8400E]"}`}
                          style={{ width: `${distribution[row.pctKey]}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
