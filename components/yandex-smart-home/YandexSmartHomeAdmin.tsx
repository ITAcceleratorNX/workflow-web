"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, Loader2, Trash2, Home } from "lucide-react"
import { formatDateTime } from "@/lib/dateTimeUtils"
import { useYandexSmartHomeTokens } from "@/hooks/use-yandex-smart-home-tokens"

interface YandexSmartHomeAdminProps {
  /** Тёмная тема (для раздела Управление на десктопе у админа) */
  dark?: boolean
}

export function YandexSmartHomeAdmin({ dark = false }: YandexSmartHomeAdminProps) {
  const {
    tokensMeta: existingToken,
    isLoading,
    error,
    tokenAction,
    handleRefreshTokens,
    handleDeleteTokens,
  } = useYandexSmartHomeTokens()

  const isRefreshing = tokenAction === "refresh"
  const isDeleting = tokenAction === "delete"

  const cardCl = dark ? "border-white/10 bg-[#2C2C2E]" : ""
  const titleCl = dark ? "text-white" : ""
  const descCl = dark ? "text-white/70" : ""
  const errorBoxCl = dark ? "bg-red-500/20 border-red-500/50" : "bg-red-50 border-red-200"
  const errorTextCl = dark ? "text-red-300" : "text-red-800"
  const loadingBoxCl = dark ? "bg-blue-500/20 border-blue-500/50" : "bg-blue-50 border-blue-200"
  const loadingTextCl = dark ? "text-blue-200" : "text-blue-800"
  const successBoxCl = dark ? "bg-blue-500/20 border-blue-500/50" : "bg-blue-50 border-blue-200"
  const successTextCl = dark ? "text-blue-200" : "text-blue-800"
  const warnBoxCl = dark ? "bg-yellow-500/20 border-yellow-500/50" : "bg-yellow-50 border-yellow-200"
  const warnTextCl = dark ? "text-yellow-200" : "text-yellow-800"
  const infoBoxCl = dark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
  const infoTextCl = dark ? "text-white/70" : "text-gray-700"
  const buttonOutlineCl = dark ? "border-white/20 text-white hover:bg-white/10" : ""

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className={`w-full ${cardCl}`}>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className={`text-base sm:text-lg flex items-center gap-2 ${titleCl}`}>
            <Home className="h-5 w-5" />
            Управление Яндекс умным домом
          </CardTitle>
          <CardDescription className={descCl}>
            Управление токенами авторизации для интеграции с Яндекс умным домом. Токены получаются через OAuth авторизацию и хранятся только на сервере.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className={`border rounded-lg p-3 ${errorBoxCl}`}>
              <div className="flex items-start gap-2">
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${dark ? "text-red-400" : "text-red-600"}`} />
                <div className={`text-sm ${errorTextCl}`}>{error}</div>
              </div>
            </div>
          )}

          {isLoading && (
            <div className={`border rounded-lg p-3 ${loadingBoxCl}`}>
              <div className="flex items-center gap-2">
                <Loader2 className={`w-4 h-4 animate-spin ${dark ? "text-blue-300" : "text-blue-600"}`} />
                <div className={`text-sm ${loadingTextCl}`}>Загрузка...</div>
              </div>
            </div>
          )}

          {existingToken && !isLoading && (
            <div className={`border rounded-lg p-3 ${successBoxCl}`}>
              <div className="flex items-start gap-2">
                <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${dark ? "text-blue-300" : "text-blue-600"}`} />
                <div className={`text-sm ${successTextCl}`}>
                  <p className="font-medium mb-1">Токены настроены</p>
                  {existingToken.created_at ? (
                    <p>Создано: {formatDateTime(existingToken.created_at)}</p>
                  ) : null}
                  {existingToken.expires_at && (
                    <p>Истекает: {formatDateTime(existingToken.expires_at)}</p>
                  )}
                  <p className={`text-xs mt-2 ${dark ? "text-blue-300/90" : "text-blue-600"}`}>Токены хранятся только на сервере и не отправляются на фронтенд</p>
                </div>
              </div>
            </div>
          )}

          {!existingToken && !isLoading && (
            <div className={`border rounded-lg p-3 ${warnBoxCl}`}>
              <div className="flex items-start gap-2">
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${dark ? "text-yellow-400" : "text-yellow-600"}`} />
                <div className={`text-sm ${warnTextCl}`}>
                  <p className="font-medium mb-1">Токены не настроены</p>
                  <p>Токены должны быть получены через OAuth авторизацию Яндекс и сохраняются автоматически на сервере.</p>
                </div>
              </div>
            </div>
          )}

          {existingToken && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => void handleRefreshTokens()}
                disabled={isRefreshing || !!tokenAction}
                variant="outline"
                className={`bg-transparent flex-1 ${buttonOutlineCl}`}
              >
                {isRefreshing ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Обновление...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4" />
                    <span>Обновить токены</span>
                  </div>
                )}
              </Button>
              <Button
                onClick={() => void handleDeleteTokens()}
                disabled={isDeleting || !!tokenAction}
                variant="destructive"
                className="flex-1 sm:flex-initial"
              >
                {isDeleting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Удаление...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    <span>Удалить</span>
                  </div>
                )}
              </Button>
            </div>
          )}

          <div className={`border rounded-lg p-3 mt-4 ${infoBoxCl}`}>
            <div className={`text-xs ${infoTextCl}`}>
              <p className="font-medium mb-1">Информация:</p>
              <p>• Endpoint для Яндекс умного дома: <code className={dark ? "bg-white/10 px-1 rounded text-white/90" : "bg-gray-100 px-1 rounded"}>GET /api/yandex-smart-home/v1.0/user/devices</code></p>
              <p>• Яндекс будет отправлять запросы с токеном в заголовке Authorization</p>
              <p>• Токены получаются через OAuth авторизацию и сохраняются автоматически на сервере</p>
              <p>• Токены хранятся только на сервере и никогда не отправляются на фронтенд</p>
              <p>• При истечении токены автоматически обновляются через refresh_token</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
