"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsListScrollArea, TabsTrigger } from "@/components/ui/tabs"
import { format, endOfDay, startOfDay } from "date-fns"
import { ru } from "date-fns/locale"
import { Calendar as CalendarIcon, Filter, RefreshCw, Eye, User, Clock, Activity, Star, Bell } from "lucide-react"
import api from "@/lib/api"
import { listLoadError } from "@/lib/request-list-loading"

interface Log {
  id: number
  request_id: number
  user_id: number
  action_type: string
  action_description: string
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  created_at: string
  user: {
    id: number
    full_name: string
    phone: string
    role: string
  } | null
  request: {
    id: number
    location: string
    status: string
  } | null
}

interface RatingLog {
  id: number
  rating_type: string
  rating_id: number
  user_id: number
  action_type: string
  action_description: string
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  created_at: string
  user?: {
    id: number
    full_name: string
    phone: string
    role: string
  }
}

interface NotificationLog {
  id: number
  notification_id: number
  user_id: number
  notification_type: string
  delivery_method: string
  status: string
  error_message: string | null
  recipient_email: string | null
  fcm_token: string | null
  created_at: string
  user?: {
    id: number
    full_name: string
    phone: string
    role: string
  }
}

interface LogsResponse {
  logs: Log[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

interface RatingLogsResponse {
  logs: RatingLog[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

interface NotificationLogsResponse {
  logs: NotificationLog[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

interface Statistics {
  totalLogs: number
  todayLogs: number
  thisWeekLogs: number
  actionTypeStats: Array<{
    action_type: string
    count: number
  }>
}

interface LogsViewerProps {
  userRole: string
  isDesktop: boolean
  dark?: boolean
}

const actionTypeColors: Record<string, string> = {
  created: "bg-green-100 text-green-800 border-green-200",
  updated: "bg-blue-100 text-blue-800 border-blue-200",
  status_changed: "bg-[#114A65]/10 text-[#114A65] border-[#114A65]/20",
  assigned: "bg-orange-100 text-orange-800 border-orange-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  commented: "bg-[#114A65]/10 text-[#114A65] border-[#114A65]/20",
  deleted: "bg-red-100 text-red-800 border-red-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
}

const actionTypeLabels: Record<string, string> = {
  created: "Создано",
  updated: "Обновлено",
  status_changed: "Статус изменен",
  assigned: "Назначено",
  completed: "Завершено",
  commented: "Комментарий",
  deleted: "Удалено",
  rejected: "Отклонено",
}
const actionTypeLabelsForRating: Record<string, string> = {
  created: "Создано",
  updated: "Обновлено",
}
const ratingTypeLabels: Record<string, string> = {
  client_rating: "Оценка клиента",
  request_rating: "Оценка заявки",
}

const notificationStatusLabels: Record<string, string> = {
  sent: "Отправлено",
  delivered: "Доставлено",
  failed: "Ошибка",
  pending: "В ожидании",
}

const deliveryMethodLabels: Record<string, string> = {
  push: "Push",
  in_app: "В приложении",
}

function validateLogPage(page: { logs: unknown[]; total: number; totalPages: number }) {
  if (!page || !Array.isArray(page.logs) || !Number.isFinite(page.total) || !Number.isFinite(page.totalPages)) {
    throw new Error("Invalid log response")
  }
}

function LogsLoadFeedback({ error, loading, hasData, onRetry }: {
  error: string | null; loading: boolean; hasData: boolean; onRetry: () => void;
}) {
  if (error) return <div role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-foreground">
    <p>{error}</p>
    {hasData && <p className="mt-1 text-sm text-muted-foreground">Показаны предыдущие результаты. Они могут не соответствовать выбранным фильтрам.</p>}
    <Button variant="outline" className="mt-3" disabled={loading} onClick={onRetry}>Повторить загрузку</Button>
  </div>
  if (loading && hasData) return <p role="status" className="mb-4 text-sm text-muted-foreground">Обновляем данные. Пока показаны предыдущие результаты.</p>
  return null
}

export function LogsViewer({ userRole, isDesktop, dark = false }: LogsViewerProps) {
  const [activeTab, setActiveTab] = useState("requests")
  
  // Логи заявок
  const [logs, setLogs] = useState<Log[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  // Логи рейтингов
  const [ratingLogs, setRatingLogs] = useState<RatingLog[]>([])
  const [ratingLoading, setRatingLoading] = useState(true)
  const [ratingPage, setRatingPage] = useState(1)
  const [ratingTotal, setRatingTotal] = useState(0)
  const [ratingTotalPages, setRatingTotalPages] = useState(0)
  
  // Логи уведомлений
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([])
  const [notificationLoading, setNotificationLoading] = useState(true)
  const [notificationPage, setNotificationPage] = useState(1)
  const [notificationTotal, setNotificationTotal] = useState(0)
  const [notificationTotalPages, setNotificationTotalPages] = useState(0)
  
  // Фильтры
  const [actionType, setActionType] = useState<string>("all")
  const [ratingType, setRatingType] = useState<string>("all")
  const [notificationStatus, setNotificationStatus] = useState<string>("all")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [logsError, setLogsError] = useState<string | null>(null)
  const [statisticsError, setStatisticsError] = useState<string | null>(null)
  const [ratingError, setRatingError] = useState<string | null>(null)
  const [notificationError, setNotificationError] = useState<string | null>(null)
  const [statisticsLoading, setStatisticsLoading] = useState(true)
  const [loadedPage, setLoadedPage] = useState(1)
  const [loadedRatingPage, setLoadedRatingPage] = useState(1)
  const [loadedNotificationPage, setLoadedNotificationPage] = useState(1)
  const logsVersion = useRef(0)
  const statisticsVersion = useRef(0)
  const ratingVersion = useRef(0)
  const notificationVersion = useRef(0)
  const canFilterRequests = userRole === "manager" || userRole === "admin-worker"
  const dateRangeError = startDate && endDate && startDate > endDate
    ? "Дата окончания должна быть не раньше даты начала" : null


  const fetchLogs = useCallback(async () => {
    const version = ++logsVersion.current
    setLoading(true)
    setLogsError(null)
    try {
      if (canFilterRequests && dateRangeError) {
        setLogsError(dateRangeError)
        return
      }
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (canFilterRequests) {
        if (actionType !== "all") params.set("action_type", actionType)
        if (startDate && endDate) {
          params.set("start_date", startOfDay(startDate).toISOString())
          params.set("end_date", endOfDay(endDate).toISOString())
        }
      }
      const endpoint = canFilterRequests ? "/request-logs/filtered" : "/request-logs/my"
      const { data } = await api.get<LogsResponse>(`${endpoint}?${params}`)
      validateLogPage(data)
      if (version !== logsVersion.current) return
      setLogs(data.logs)
      setTotal(data.total)
      setTotalPages(data.totalPages)
      setLoadedPage(page)
    } catch (error) {
      if (version === logsVersion.current) setLogsError(listLoadError(error))
    } finally {
      if (version === logsVersion.current) setLoading(false)
    }
  }, [page, pageSize, actionType, startDate, endDate, canFilterRequests, dateRangeError])

  const fetchStatistics = useCallback(async () => {
    const version = ++statisticsVersion.current
    setStatisticsError(null)
    if (!canFilterRequests) {
      // The API has no personal statistics route. Do not fabricate zero counters.
      setStatisticsLoading(false)
      setStatistics(null)
      return
    }
    setStatisticsLoading(true)
    try {
      const { data } = await api.get<Statistics>("/request-logs/statistics")
      if (![data.totalLogs, data.todayLogs, data.thisWeekLogs].every(Number.isFinite) || !Array.isArray(data.actionTypeStats)) {
        throw new Error("Invalid statistics response")
      }
      if (version === statisticsVersion.current) setStatistics(data)
    } catch (error) {
      if (version === statisticsVersion.current) setStatisticsError(listLoadError(error))
    } finally {
      if (version === statisticsVersion.current) setStatisticsLoading(false)
    }
  }, [canFilterRequests])

  const fetchRatingLogs = useCallback(async () => {
    const version = ++ratingVersion.current
    setRatingLoading(true)
    setRatingError(null)
    try {
      const params = new URLSearchParams({ page: String(ratingPage), pageSize: String(pageSize) })
      if (actionType !== "all") params.set("actionType", actionType)
      const types = ratingType === "all" ? ["request_rating", "client_rating"] : [ratingType]
      const responses = await Promise.all(types.map((type) =>
        api.get<{ success: boolean; data: RatingLogsResponse }>(`/rating-logs/type/${type}?${params}`)))
      const pages = responses.map(({ data }) => {
        if (!data.success) throw new Error("Rating logs are unavailable")
        validateLogPage(data.data)
        return data.data
      })
      if (version !== ratingVersion.current) return
      setRatingLogs(pages.flatMap((result) => result.logs).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)))
      setRatingTotal(pages.reduce((sum, result) => sum + result.total, 0))
      setRatingTotalPages(Math.max(0, ...pages.map((result) => result.totalPages)))
      setLoadedRatingPage(ratingPage)
    } catch (error) {
      if (version === ratingVersion.current) setRatingError(listLoadError(error))
    } finally {
      if (version === ratingVersion.current) setRatingLoading(false)
    }
  }, [ratingPage, pageSize, ratingType, actionType])

  const fetchNotificationLogs = useCallback(async () => {
    const version = ++notificationVersion.current
    setNotificationLoading(true)
    setNotificationError(null)
    try {
      if (dateRangeError) {
        setNotificationError(dateRangeError)
        return
      }
      const params = new URLSearchParams({ page: String(notificationPage), pageSize: String(pageSize) })
      if (startDate && endDate) {
        params.set("startDate", startOfDay(startDate).toISOString())
        params.set("endDate", endOfDay(endDate).toISOString())
      }
      const statuses = notificationStatus === "all" ? ["delivered", "sent", "failed", "pending"] : [notificationStatus]
      const responses = await Promise.all(statuses.map((status) =>
        api.get<{ success: boolean; data: NotificationLogsResponse }>(`/notification-logs/status/${status}?${params}`)))
      const pages = responses.map(({ data }) => {
        if (!data.success) throw new Error("Notification logs are unavailable")
        validateLogPage(data.data)
        return data.data
      })
      if (version !== notificationVersion.current) return
      setNotificationLogs(pages.flatMap((result) => result.logs).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)))
      setNotificationTotal(pages.reduce((sum, result) => sum + result.total, 0))
      setNotificationTotalPages(Math.max(0, ...pages.map((result) => result.totalPages)))
      setLoadedNotificationPage(notificationPage)
    } catch (error) {
      if (version === notificationVersion.current) setNotificationError(listLoadError(error))
    } finally {
      if (version === notificationVersion.current) setNotificationLoading(false)
    }
  }, [notificationPage, pageSize, notificationStatus, startDate, endDate, dateRangeError])

  useEffect(() => {
    if (activeTab === "requests") void fetchLogs()
    return () => { logsVersion.current += 1 }
  }, [activeTab, fetchLogs])

  useEffect(() => {
    void fetchStatistics()
    return () => { statisticsVersion.current += 1 }
  }, [fetchStatistics])

  useEffect(() => {
    if (activeTab === "ratings") void fetchRatingLogs()
    return () => { ratingVersion.current += 1 }
  }, [activeTab, fetchRatingLogs])

  useEffect(() => {
    if (activeTab === "notifications") void fetchNotificationLogs()
    return () => { notificationVersion.current += 1 }
  }, [activeTab, fetchNotificationLogs])

  const resetPages = () => {
    setPage(1)
    setRatingPage(1)
    setNotificationPage(1)
  }

  const handleRefresh = () => {
    if (activeTab === "requests") { void fetchLogs(); void fetchStatistics() }
    if (activeTab === "ratings") void fetchRatingLogs()
    if (activeTab === "notifications") void fetchNotificationLogs()
  }

  const clearFilters = () => {
    setActionType("all")
    setRatingType("all")
    setNotificationStatus("all")
    setStartDate(undefined)
    setEndDate(undefined)
    setPage(1)
    setRatingPage(1)
    setNotificationPage(1)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return Number.isNaN(date.getTime()) ? "Дата неизвестна" : format(date, "dd.MM.yyyy HH:mm", { locale: ru })
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "created":
        return <Activity className="w-4 h-4" />
      case "updated":
        return <RefreshCw className="w-4 h-4" />
      case "status_changed":
        return <Clock className="w-4 h-4" />
      case "assigned":
        return <User className="w-4 h-4" />
      case "completed":
        return <Eye className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const cardClasses = dark ? "border-[#3A3A3C] bg-[#2C2C2E]" : "";
  const cardTitleClasses = dark ? "text-white" : "";
  const cardDescClasses = dark ? "text-[#8E8E93]" : "";
  const selectTriggerClasses = dark ? "bg-[#1C1C1E] border-[#3A3A3C] text-white" : "";
  const selectContentClasses = dark ? "bg-[#2C2C2E] border-[#3A3A3C]" : "";
  const selectItemClasses = dark ? "text-white focus:bg-[#3A3A3C]" : "";
  const inputClasses = dark ? "bg-[#1C1C1E] border-[#3A3A3C] text-white placeholder:text-[#6E6E6E]" : "";
  const labelClasses = dark ? "text-[#E5E5EA]" : "";
  const dateBtnClasses = dark ? "bg-[#1C1C1E] border-[#3A3A3C] text-white hover:bg-[#3A3A3C]" : "";
  const popoverClasses = dark ? "bg-[#2C2C2E] border-[#3A3A3C]" : "";
  const primaryBtnClasses = dark ? "bg-[#F35713] hover:bg-[#e04f10] text-white" : "";
  const outlineBtnClasses = dark ? "border-[#3A3A3C] text-[#E5E5EA] hover:bg-[#3A3A3C]" : "";
  const logItemClasses = dark ? "border-[#3A3A3C] hover:bg-[#3A3A3C] text-white" : "border-gray-200 hover:bg-gray-50";
  const logTextClasses = dark ? "text-[#E5E5EA]" : "";
  const logMutedClasses = dark ? "text-[#8E8E93]" : "text-gray-500";
  const logGrayClasses = dark ? "text-[#8E8E93]" : "text-gray-600";

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Табы */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsListScrollArea>
          <TabsList className={`grid w-max min-w-full grid-cols-3 grid-flow-col [&>button]:flex-shrink-0 [&>button]:whitespace-nowrap ${dark ? "bg-[#2C2C2E] border-[#3A3A3C]" : ""}`}>
            <TabsTrigger value="requests" className={`flex items-center gap-2 ${dark ? "text-[#8E8E93] data-[state=active]:bg-[#F35713] data-[state=active]:text-white" : ""}`}>
            <Activity className="w-4 h-4" />
            Заявки
          </TabsTrigger>
          <TabsTrigger value="ratings" className={`flex items-center gap-2 ${dark ? "text-[#8E8E93] data-[state=active]:bg-[#F35713] data-[state=active]:text-white" : ""}`}>
            <Star className="w-4 h-4" />
            Рейтинги
          </TabsTrigger>
          <TabsTrigger value="notifications" className={`flex items-center gap-2 ${dark ? "text-[#8E8E93] data-[state=active]:bg-[#F35713] data-[state=active]:text-white" : ""}`}>
            <Bell className="w-4 h-4" />
            Уведомления
          </TabsTrigger>
        </TabsList>
        </TabsListScrollArea>

        <TabsContent value="requests" className="space-y-6">
          {/* Статистика */}
          {!canFilterRequests && <p className="text-sm text-muted-foreground">Статистика личного журнала пока недоступна.</p>}
          <LogsLoadFeedback error={statisticsError} loading={statisticsLoading} hasData={statistics !== null} onRetry={fetchStatistics} />
          {statisticsLoading && !statistics ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className={`w-full ${cardClasses}`}>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-3 md:h-4 bg-gray-200 rounded animate-pulse w-16 md:w-20"></div>
                    <div className="h-6 md:h-8 bg-gray-200 rounded animate-pulse w-12 md:w-16"></div>
                  </div>
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : statistics ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full">
          <Card className={`w-full ${cardClasses}`}>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs md:text-sm font-medium ${dark ? "text-[#8E8E93]" : "text-gray-600"}`}>Всего логов</p>
                  <p className={`text-lg md:text-2xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>{statistics?.totalLogs || 0}</p>
                </div>
                <Activity className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className={`w-full ${cardClasses}`}>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs md:text-sm font-medium ${dark ? "text-[#8E8E93]" : "text-gray-600"}`}>Сегодня</p>
                  <p className="text-lg md:text-2xl font-bold text-green-600">{statistics?.todayLogs || 0}</p>
                </div>
                <Clock className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className={`w-full ${cardClasses}`}>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs md:text-sm font-medium ${dark ? "text-[#8E8E93]" : "text-gray-600"}`}>За неделю</p>
                  <p className="text-lg md:text-2xl font-bold text-[#114A65]">{statistics?.thisWeekLogs || 0}</p>
                </div>
                <RefreshCw className="w-6 h-6 md:w-8 md:h-8 text-[#114A65]" />
              </div>
            </CardContent>
          </Card>
          
          <Card className={`w-full ${cardClasses}`}>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs md:text-sm font-medium ${dark ? "text-[#8E8E93]" : "text-gray-600"}`}>Типы действий</p>
                  <p className="text-lg md:text-2xl font-bold text-orange-600">{statistics?.actionTypeStats?.length || 0}</p>
                </div>
                <Filter className="w-6 h-6 md:w-8 md:h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Фильтры */}
      <Card className={`w-full ${cardClasses}`}>
        <CardHeader className="pb-3">
          <CardTitle className={`flex items-center gap-2 text-base md:text-lg ${cardTitleClasses}`}>
            <Filter className="w-4 h-4 md:w-5 md:h-5" />
            Фильтры логов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 w-full">
            <div>
              <Label htmlFor="actionType" className={labelClasses}>Тип действия</Label>
              <Select disabled={!canFilterRequests} value={actionType || "all"} onValueChange={(value) => { setActionType(value); resetPages() }}>
                <SelectTrigger className={selectTriggerClasses}>
                  <SelectValue placeholder="Все типы" />
                </SelectTrigger>
                <SelectContent className={selectContentClasses}>
                  <SelectItem value="all" className={selectItemClasses}>Все типы</SelectItem>
                  {Object.entries(actionTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key} className={selectItemClasses}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className={labelClasses}>Дата начала</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button disabled={!canFilterRequests} variant="outline" className={`w-full justify-start text-left font-normal ${dateBtnClasses}`}>
                    {startDate ? format(startDate, "dd.MM.yyyy", { locale: ru }) : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className={`w-auto p-0 ${popoverClasses}`}>
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(value) => { setStartDate(value); resetPages() }}
                    initialFocus
                    locale={ru}
                    className={dark ? "bg-[#2C2C2E] text-white [&_button]:text-white [&_button:hover]:bg-[#3A3A3C]" : ""}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className={labelClasses}>Дата окончания</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button disabled={!canFilterRequests} variant="outline" className={`w-full justify-start text-left font-normal ${dateBtnClasses}`}>
                    {endDate ? format(endDate, "dd.MM.yyyy", { locale: ru }) : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className={`w-auto p-0 ${popoverClasses}`}>
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(value) => { setEndDate(value); resetPages() }}
                    initialFocus
                    locale={ru}
                    className={dark ? "bg-[#2C2C2E] text-white [&_button]:text-white [&_button:hover]:bg-[#3A3A3C]" : ""}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label className={`text-xs flex items-center gap-1 ${dark ? "text-[#8E8E93]" : "text-gray-500"}`}>
                <span className="text-yellow-500">⚠️</span>
                Фильтр по датам работает только при указании обеих дат
              </Label>
            </div>

            <div>
              <Label htmlFor="search" className={labelClasses}>Поиск</Label>
              <Input id="search" disabled placeholder="Поиск по описанию пока недоступен" className={inputClasses} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-4 w-full">
            <Button onClick={handleRefresh} disabled={loading} className={`flex-1 sm:flex-none ${primaryBtnClasses}`}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Обновить
            </Button>
            <Button variant="outline" onClick={clearFilters} className={`flex-1 sm:flex-none ${outlineBtnClasses}`}>
              Очистить фильтры
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Логи */}
      <Card className={`w-full ${cardClasses}`}>
        <CardHeader className="pb-3">
          <CardTitle className={`text-base md:text-lg ${cardTitleClasses}`}>Логи заявок</CardTitle>
          <CardDescription className={`text-sm ${cardDescClasses}`}>
            Показано {logs.length} из {total} записей
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LogsLoadFeedback error={logsError} loading={loading} hasData={logs.length > 0} onRetry={fetchLogs} />
          {loading && logs.length === 0 ? (
            <div className={`flex items-center justify-center py-8 ${logMutedClasses}`}>
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Загрузка логов...
            </div>
          ) : logs.length === 0 ? (!logsError && (
            <div className={`text-center py-8 ${logMutedClasses}`}>
              Логи не найдены
            </div>
          )) : (
            <div className="space-y-4 w-full">
              {logs.map((log) => (
                <div key={log.id} className={`border rounded-lg p-3 md:p-4 transition-colors w-full break-words ${logItemClasses}`}>
                  <div className="flex items-start justify-between w-full">
                    <div className="flex-1 min-w-0 max-w-full">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {getActionIcon(log.action_type)}
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${actionTypeColors[log.action_type] || (dark ? "bg-[#3A3A3C] text-[#E5E5EA] border-[#3A3A3C]" : "bg-gray-100 text-gray-800 border-gray-200")}`}
                        >
                          {actionTypeLabels[log.action_type] || log.action_type}
                        </Badge>
                        <span className={`text-xs md:text-sm ${logMutedClasses}`}>
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                      
                      <p className={`text-sm font-medium mb-1 break-words max-w-full overflow-hidden ${logTextClasses}`}>{log.action_description}</p>
                      
                      <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm w-full ${logGrayClasses}`}>
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          <User className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                          <span className="truncate">{log.user ? `${log.user.full_name} (${log.user.role})` : `Пользователь ID: ${log.user_id}`}</span>
                        </div>
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          <span className="truncate">Заявка № {log.request?.id ?? log.request_id}: {log.request?.location ?? "Удалена или недоступна"}</span>
                        </div>
                      </div>

                      {(log.old_values || log.new_values) && (
                        <div className={`mt-2 text-xs w-full ${logMutedClasses}`}>
                          {log.old_values && (
                            <div className="break-all">Было: {JSON.stringify(log.old_values)}</div>
                          )}
                          {log.new_values && (
                            <div className="break-all">Стало: {JSON.stringify(log.new_values)}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 w-full">
              <div className={`text-sm text-center sm:text-left ${logMutedClasses}`}>
                Страница {loadedPage} из {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={loading || !!logsError || page <= 1}
                  className={`px-3 py-1 text-xs ${outlineBtnClasses}`}
                >
                  Назад
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={loading || !!logsError || page >= totalPages}
                  className={`px-3 py-1 text-xs ${outlineBtnClasses}`}
                >
                  Вперед
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="ratings" className="space-y-6">
          {/* Фильтры для рейтингов */}
          <Card className={`w-full ${cardClasses}`}>
            <CardHeader className="pb-3">
              <CardTitle className={`flex items-center gap-2 text-base md:text-lg ${cardTitleClasses}`}>
                <Filter className="w-4 h-4 md:w-5 md:h-5" />
                Фильтры логов рейтингов
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 w-full">
                <div>
                  <Label htmlFor="ratingType" className={labelClasses}>Тип рейтинга</Label>
                  <Select value={ratingType || "all"} onValueChange={(value) => { setRatingType(value); resetPages() }}>
                    <SelectTrigger className={selectTriggerClasses}>
                      <SelectValue placeholder="Все типы" />
                    </SelectTrigger>
                    <SelectContent className={selectContentClasses}>
                      <SelectItem value="all" className={selectItemClasses}>Все типы</SelectItem>
                      {Object.entries(ratingTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key} className={selectItemClasses}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="actionType" className={labelClasses}>Тип действия</Label>
                  <Select value={actionType || "all"} onValueChange={(value) => { setActionType(value); resetPages() }}>
                    <SelectTrigger className={selectTriggerClasses}>
                      <SelectValue placeholder="Все действия" />
                    </SelectTrigger>
                    <SelectContent className={selectContentClasses}>
                      <SelectItem value="all" className={selectItemClasses}>Все действия</SelectItem>
                      {Object.entries(actionTypeLabelsForRating).map(([key, label]) => (
                        <SelectItem key={key} value={key} className={selectItemClasses}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Логи рейтингов */}
          <Card className={`w-full ${cardClasses}`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-base md:text-lg ${cardTitleClasses}`}>Логи рейтингов</CardTitle>
              <CardDescription className={`text-sm ${cardDescClasses}`}>
                Показано {ratingLogs?.length || 0} из {ratingTotal} записей
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LogsLoadFeedback error={ratingError} loading={ratingLoading} hasData={ratingLogs.length > 0} onRetry={fetchRatingLogs} />
          {ratingLoading && ratingLogs.length === 0 ? (
                <div className={`flex items-center justify-center py-8 ${logMutedClasses}`}>
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Загрузка логов рейтингов...
                </div>
              ) : ratingLogs?.length === 0 ? (!ratingError && (
                <div className={`text-center py-8 ${logMutedClasses}`}>
                  Логи рейтингов не найдены
                </div>
              )) : (
                <div className="space-y-4 w-full">
                  {ratingLogs?.map((log) => (
                    <div key={log.id} className={`border rounded-lg p-3 md:p-4 transition-colors w-full break-words ${logItemClasses}`}>
                      <div className="flex items-start justify-between w-full">
                        <div className="flex-1 min-w-0 max-w-full">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Star className="w-4 h-4" />
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${actionTypeColors[log.action_type] || (dark ? "bg-[#3A3A3C] text-[#E5E5EA] border-[#3A3A3C]" : "bg-gray-100 text-gray-800 border-gray-200")}`}
                            >
                              {actionTypeLabels[log.action_type] || log.action_type}
                            </Badge>
                            <Badge variant="outline" className={`text-xs ${dark ? "bg-[#3A3A3C] text-blue-300 border-[#3A3A3C]" : "bg-blue-100 text-blue-800 border-blue-200"}`}>
                              {ratingTypeLabels[log.rating_type] || log.rating_type}
                            </Badge>
                            <span className={`text-xs md:text-sm ${logMutedClasses}`}>
                              {formatDate(log.created_at)}
                            </span>
                          </div>
                          
                          <p className="text-sm font-medium mb-1 break-words max-w-full overflow-hidden">{log.action_description}</p>
                          
                                                     <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-gray-600 w-full">
                             <div className="flex items-center gap-1 min-w-0 flex-1">
                               <User className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                               <span className="truncate">
                                 {log.user ? `${log.user.full_name} (${log.user.role})` : `Пользователь ID: ${log.user_id}`}
                               </span>
                             </div>
                             <div className="flex items-center gap-1 min-w-0 flex-1">
                               <span className="truncate">Рейтинг ID: {log.rating_id}</span>
                             </div>
                           </div>

                          {(log.old_values || log.new_values) && (
                            <div className={`mt-2 text-xs w-full ${logMutedClasses}`}>
                              {log.old_values && (
                                <div className="break-all">Было: {JSON.stringify(log.old_values)}</div>
                              )}
                              {log.new_values && (
                                <div className="break-all">Стало: {JSON.stringify(log.new_values)}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Пагинация для рейтингов */}
              {ratingTotalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 w-full">
                  <div className={`text-sm text-center sm:text-left ${logMutedClasses}`}>
                    Страница {loadedRatingPage} из {ratingTotalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRatingPage(ratingPage - 1)}
                      disabled={ratingLoading || !!ratingError || ratingPage <= 1}
                      className={`px-3 py-1 text-xs ${outlineBtnClasses}`}
                    >
                      Назад
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRatingPage(ratingPage + 1)}
                      disabled={ratingLoading || !!ratingError || ratingPage >= ratingTotalPages}
                      className={`px-3 py-1 text-xs ${outlineBtnClasses}`}
                    >
                      Вперед
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          {/* Фильтры для уведомлений */}
          <Card className={`w-full ${cardClasses}`}>
            <CardHeader className="pb-3">
              <CardTitle className={`flex items-center gap-2 text-base md:text-lg ${cardTitleClasses}`}>
                <Filter className="w-4 h-4 md:w-5 md:h-5" />
                Фильтры логов уведомлений
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 w-full">
                <div>
                  <Label htmlFor="notificationStatus" className={labelClasses}>Статус уведомления</Label>
                  <Select value={notificationStatus || "all"} onValueChange={(value) => { setNotificationStatus(value); resetPages() }}>
                    <SelectTrigger className={selectTriggerClasses}>
                      <SelectValue placeholder="Все статусы" />
                    </SelectTrigger>
                    <SelectContent className={selectContentClasses}>
                      <SelectItem value="all" className={selectItemClasses}>Все статусы</SelectItem>
                      {Object.entries(notificationStatusLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key} className={selectItemClasses}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Логи уведомлений */}
          <Card className={`w-full ${cardClasses}`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-base md:text-lg ${cardTitleClasses}`}>Логи уведомлений</CardTitle>
              <CardDescription className={`text-sm ${cardDescClasses}`}>
                Показано {notificationLogs?.length || 0} из {notificationTotal} записей
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LogsLoadFeedback error={notificationError} loading={notificationLoading} hasData={notificationLogs.length > 0} onRetry={fetchNotificationLogs} />
          {notificationLoading && notificationLogs.length === 0 ? (
                <div className={`flex items-center justify-center py-8 ${logMutedClasses}`}>
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Загрузка логов уведомлений...
                </div>
              ) : notificationLogs?.length === 0 ? (!notificationError && (
                <div className={`text-center py-8 ${logMutedClasses}`}>
                  Логи уведомлений не найдены
                </div>
              )) : (
                <div className="space-y-4 w-full">
                  {notificationLogs?.map((log) => (
                    <div key={log.id} className={`border rounded-lg p-3 md:p-4 transition-colors w-full break-words ${logItemClasses}`}>
                      <div className="flex items-start justify-between w-full">
                        <div className="flex-1 min-w-0 max-w-full">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Bell className="w-4 h-4" />
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                dark ? (
                                  log.status === 'delivered' ? 'bg-green-900/30 text-green-400 border-green-700' :
                                  log.status === 'failed' ? 'bg-red-900/30 text-red-400 border-red-700' :
                                  log.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700' :
                                  'bg-[#3A3A3C] text-[#E5E5EA] border-[#3A3A3C]'
                                ) : (
                                  log.status === 'delivered' ? 'bg-green-100 text-green-800 border-green-200' :
                                  log.status === 'failed' ? 'bg-red-100 text-red-800 border-red-200' :
                                  log.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                  'bg-gray-100 text-gray-800 border-gray-200'
                                )
                              }`}
                            >
                              {notificationStatusLabels[log.status] || log.status}
                            </Badge>
                            <Badge variant="outline" className={`text-xs ${dark ? "bg-[#3A3A3C] text-blue-300 border-[#3A3A3C]" : "bg-blue-100 text-blue-800 border-blue-200"}`}>
                              {deliveryMethodLabels[log.delivery_method] || log.delivery_method}
                            </Badge>
                            <span className={`text-xs md:text-sm ${logMutedClasses}`}>
                              {formatDate(log.created_at)}
                            </span>
                          </div>
                          
                          <p className={`text-sm font-medium mb-1 break-words max-w-full overflow-hidden ${logTextClasses}`}>
                            {log.notification_type} - {log.recipient_email || 'Email не указан'}
                          </p>
                          
                          <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm w-full ${logGrayClasses}`}>
                             <div className="flex items-center gap-1 min-w-0 flex-1">
                               <User className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                               <span className="truncate">
                                 {log.user ? `${log.user.full_name} (${log.user.role})` : `Пользователь ID: ${log.user_id}`}
                               </span>
                             </div>
                             <div className="flex items-center gap-1 min-w-0 flex-1">
                               <span className="truncate">Уведомление ID: {log.notification_id}</span>
                             </div>
                           </div>

                          {log.error_message && (
                            <div className="mt-2 text-xs text-red-500 w-full">
                              Ошибка: {log.error_message}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Пагинация для уведомлений */}
              {notificationTotalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 w-full">
                  <div className={`text-sm text-center sm:text-left ${logMutedClasses}`}>
                    Страница {loadedNotificationPage} из {notificationTotalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNotificationPage(notificationPage - 1)}
                      disabled={notificationLoading || !!notificationError || notificationPage <= 1}
                      className={`px-3 py-1 text-xs ${outlineBtnClasses}`}
                    >
                      Назад
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNotificationPage(notificationPage + 1)}
                      disabled={notificationLoading || !!notificationError || notificationPage >= notificationTotalPages}
                      className={`px-3 py-1 text-xs ${outlineBtnClasses}`}
                    >
                      Вперед
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
