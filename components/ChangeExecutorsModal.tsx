"use client"

/**
 * ChangeExecutorsModal - Моделька для изменения исполнителей
 * 
 * Минималистичный дизайн:
 * - Чистый интерфейс без лишних эффектов
 * - Адаптивность от 280px до 2xl экранов
 * - Простые цвета и переходы
 */

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, User, Trash2, CheckCircle, AlertTriangle, X, Crown } from "lucide-react"
import api from "@/lib/api"
import { useRequestStore } from "@/stores/useRequestStore"

interface User {
  id: number
  full_name: string
  phone?: string
  role: string
}

interface Executor {
  id: number
  executor_id: number
  user: User
  specialty: string
  rating: number
  workload: number
}

interface SubRequestExecutor {
  id: number
  role: 'executor' | 'leader'
  specialty: string
  user: { id: number; full_name: any; phone?: string; }
  RequestExecutor?: { role: string }
}

interface SubRequest {
  id: number
  title: string
  description: string
  category_id: number
  status: string
  executors?: SubRequestExecutor[]
}

interface ChangeExecutorsModalProps {
  isOpen: boolean
  onClose: () => void
  subRequest: SubRequest | null
  executors: Executor[]
  userServiceCategoryId?: number
  onSuccess: () => void
  variant?: "default" | "dark"
}

export function ChangeExecutorsModal({
  isOpen,
  onClose,
  subRequest,
  executors,
  userServiceCategoryId,
  onSuccess,
  variant = "default",
}: ChangeExecutorsModalProps) {
  const isDark = variant === "dark";
  const [selectedExecutors, setSelectedExecutors] = useState<SubRequestExecutor[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Фильтруем исполнителей только для категории пользователя
  const availableExecutors = executors.filter(executor => 
    !selectedExecutors.some(selected => selected.id === executor.id)
  )

  // Проверяем, может ли пользователь изменять исполнителей для этой под заявки
  const canChangeExecutors = subRequest && executors.length > 0 && 
    subRequest.status !== 'in_progress' && subRequest.status !== 'awaiting_assignment' && subRequest.status !== "completed"

  useEffect(() => {
    if (isOpen && subRequest) {
      // Инициализируем с существующими исполнителями
      setSelectedExecutors(subRequest.executors || [])
      setError(null)
    }
  }, [isOpen, subRequest])

  const handleAddExecutor = (executorId: string) => {
    // Игнорируем специальное значение "no-executors"
    if (executorId === "no-executors") return;
    
    const executor = executors.find(e => e.id === parseInt(executorId))
    if (executor && !selectedExecutors.some(e => e.id === executor.id)) {
      setSelectedExecutors(prev => [...prev, { id: executor.id, role: 'executor' as const, RequestExecutor: {role: 'executor'}, specialty: executor.specialty, user: { id: executor.user.id, full_name: executor.user.full_name, phone: executor.user.phone } }])
    }
  }

  const handleRemoveExecutor = (executorId: number) => {
    setSelectedExecutors(prev => prev.filter(e => e.id !== executorId))
  }

  const handleRoleChange = (executorId: number, role: 'executor' | 'leader') => {
    setSelectedExecutors(prev => 
      prev.map(e => e.id === executorId ? { ...e, role, RequestExecutor: {role} } : e)
    )
  }

  const handleSubmit = async () => {
    if (!subRequest) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Оптимистичное обновление - обновляем состояние сразу
      const { updateSubRequestExecutors } = useRequestStore.getState();
      
      const allRequests = [
        ...useRequestStore.getState().requests,
        ...useRequestStore.getState().myRequests,
        ...useRequestStore.getState().incomingRequests,
        ...useRequestStore.getState().assignedRequests,
        ...useRequestStore.getState().completedRequests
      ];
      
      const requestGroup = allRequests.find(group => 
        group.requests.some(subReq => subReq.id === subRequest.id)
      );
      
      if (requestGroup) {
        // Обновляем исполнителей и статус
        updateSubRequestExecutors(requestGroup.id, subRequest.id, selectedExecutors, subRequest.status);
        
        // Также обновляем статус группы заявок
        const { updateRequestGroupStatus } = useRequestStore.getState();
        updateRequestGroupStatus(requestGroup.id);
      }
      
      // Отправляем запрос на сервер
      await api.put(`/request-executors/${subRequest.id}/change`, {
        executors: selectedExecutors
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      // В случае ошибки откатываем изменения
      const { updateSubRequestExecutors } = useRequestStore.getState();
      
      const allRequests = [
        ...useRequestStore.getState().requests,
        ...useRequestStore.getState().myRequests,
        ...useRequestStore.getState().incomingRequests,
        ...useRequestStore.getState().assignedRequests,
        ...useRequestStore.getState().completedRequests
      ];
      
      const requestGroup = allRequests.find(group => 
        group.requests.some(subReq => subReq.id === subRequest.id)
      );
      
      if (requestGroup) {
        // Возвращаем предыдущих исполнителей
        updateSubRequestExecutors(requestGroup.id, subRequest.id, subRequest.executors || [], subRequest.status);
        
        // Также обновляем статус группы заявок
        const { updateRequestGroupStatus } = useRequestStore.getState();
        updateRequestGroupStatus(requestGroup.id);
      }
      
      console.error("Ошибка при изменении исполнителей:", error)
      setError("Не удалось изменить исполнителей")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !subRequest) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-3 md:p-4 z-[100] min-h-screen">
      <Card className={`w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl border-0 min-w-[280px] sm:min-w-[320px] ${isDark ? "bg-[#1C1C1E] border border-white/10" : "bg-white"}`}>
        <CardHeader className={`pb-4 border-b ${isDark ? "border-white/10" : "border-gray-100"}`}>
          <div className="flex items-center justify-between">
            <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"}`}>
              <Users className={`h-5 w-5 ${isDark ? "text-[#F35713]" : "text-[#114A65]"}`} />
              Изменить исполнителей
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className={`h-8 w-8 p-0 rounded-full ${isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100"}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Заявка: {subRequest.title}
          </p>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {error && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${isDark ? "bg-red-500/10 border border-red-500/30" : "bg-red-50 border border-red-200"}`}>
              <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${isDark ? "text-red-400" : "text-red-600"}`} />
              <p className={`text-sm ${isDark ? "text-red-300" : "text-red-700"}`}>{error}</p>
            </div>
          )}

          {!canChangeExecutors ? (
            <div className="text-center py-8">
              <AlertTriangle className={`h-12 w-12 mx-auto mb-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
              <p className={`mb-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>Невозможно изменить исполнителей</p>
              <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                {!executors.length 
                  ? "Нет доступных исполнителей для этой категории"
                  : "В этом заявке назначены исполнители другого департамента"
                }
              </p>
            </div>
          ) : (
            <>
              {/* Добавление исполнителей */}
              <div className="space-y-3">
                <Label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Добавить исполнителя
                </Label>
                <Select onValueChange={handleAddExecutor} value="">
                  <SelectTrigger className={`w-full h-11 ${isDark ? "bg-[#2C2C2E] border-white/10 text-white" : "border-gray-200 focus:border-[#114A65] focus:ring-[#114A65]"}`}>
                    <SelectValue placeholder="Выберите исполнителя" />
                  </SelectTrigger>
                  <SelectContent className={`z-[110] ${isDark ? "bg-[#2C2C2E] border-white/10" : ""}`}>
                    {availableExecutors.length === 0 ? (
                      <SelectItem value="no-executors" disabled>
                        Все исполнители уже назначены
                      </SelectItem>
                    ) : (
                      availableExecutors.map((executor) => (
                        <SelectItem key={executor.id} value={executor.id.toString()}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{executor.user.full_name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {executor.specialty}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Список выбранных исполнителей */}
              {selectedExecutors.length > 0 && (
                <div className="space-y-3">
                  <Label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Назначенные исполнители ({selectedExecutors.length})
                  </Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedExecutors.map((executor) => {
                      return (
                        <div
                          key={executor.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${isDark ? "bg-[#2C2C2E] border-white/10" : "bg-gray-50 border-gray-200"}`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              {executor.role === 'leader' ? (
                                <Crown className={`h-4 w-4 ${isDark ? "text-[#F35713]" : "text-yellow-600"}`} />
                              ) : (
                                <User className={`h-4 w-4 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                                {executor?.user.full_name || 'Неизвестный исполнитель'}
                              </p>
                              {executor?.specialty && (
                                <p className={`text-xs truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                  {executor.specialty}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Выбор роли */}
                            <Select
                              value={executor.role || 'executor'}
                              onValueChange={(role: 'executor' | 'leader') => 
                                handleRoleChange(executor.id, role)
                              }
                            >
                              <SelectTrigger className={`w-24 h-8 text-xs ${isDark ? "bg-[#2C2C2E] border-white/10 text-white" : "border-gray-200"}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className={`z-[110] ${isDark ? "bg-[#2C2C2E] border-white/10" : ""}`}>
                                <SelectItem value="executor">Исполнитель</SelectItem>
                                <SelectItem value="leader">Лидер</SelectItem>
                              </SelectContent>
                            </Select>

                            {/* Кнопка удаления */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveExecutor(executor.id)}
                              className={`h-8 w-8 p-0 text-gray-400 ${isDark ? "hover:bg-red-500/20 hover:text-red-400" : "hover:bg-red-100 hover:text-red-600"}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Индикатор лидера */}
                  <div className="mt-2 sm:mt-3 md:mt-4">
                    {selectedExecutors.some(e => e.role === 'leader') ? (
                        <div className={`flex items-center gap-2 p-2 sm:p-3 rounded-lg ${isDark ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/30" : "text-green-600 bg-green-50 border border-green-200"}`}>
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                          <span className="text-xs sm:text-sm font-medium">Лидер назначен</span>
                        </div>
                    ) : (
                        <div className={`flex items-center gap-2 p-2 sm:p-3 rounded-lg ${isDark ? "text-[#F35713] bg-[#F35713]/10 border border-[#F35713]/30" : "text-amber-600 bg-amber-50 border border-amber-200"}`}>
                          <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                          <span className="text-xs sm:text-sm font-medium">Необходимо назначить лидера</span>
                        </div>
                    )}
                  </div>
                </div>
              )}

              {/* Кнопки действий */}
              <div className={`flex flex-col sm:flex-row gap-3 pt-4 border-t ${isDark ? "border-white/10" : "border-gray-100"}`}>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className={`flex-1 h-11 ${isDark ? "border-white/20 text-white hover:bg-white/10" : "border-gray-200 hover:bg-gray-50"}`}
                  disabled={isSubmitting}
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !selectedExecutors.some(e => e.role === 'leader')}
                  className={`flex-1 h-11 text-white disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? "bg-[#F35713] hover:bg-[#E04A0A]" : "bg-gradient-to-r from-[#114A65] to-[#B8400E] hover:from-[#0d3a4f] hover:to-[#A3390D]"}`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Изменение...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Изменить исполнителей
                    </div>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
