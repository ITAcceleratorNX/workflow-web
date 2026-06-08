"use client";

import Link from "next/link";
import { ArrowLeft, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DesktopContentPage } from "@/components/layout/desktop-content-page";
import type { UseExecutorScanQrResult } from "@/hooks/use-executor-scan-qr";
import { ExecutorInlineQrScanner } from "./executor-inline-qr-scanner";

const BACK_HREF = "/executor/management";

type ExecutorScanQrDesktopProps = UseExecutorScanQrResult;

export function ExecutorScanQrDesktop({
  permissionState,
  scanned,
  handleScanPayload,
  handleScanAgain,
  handleRefresh,
  requestPermission,
}: ExecutorScanQrDesktopProps) {
  return (
    <DesktopContentPage
      title="QR сканер"
      description="Сканирование QR-кодов бронирования"
      dark
      actions={
        <Link
          href={BACK_HREF}
          className="inline-flex items-center gap-2 text-sm text-[#E85D2B] hover:text-[#F35713]"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Link>
      }
    >
      {permissionState === "loading" ? (
        <div className="rounded-2xl border border-[#3A3A3C] bg-[#2C2C2E] p-5 max-w-lg">
          <p className="text-sm text-white/60">Запрос доступа к камере…</p>
        </div>
      ) : permissionState === "denied" ? (
        <div className="rounded-2xl border border-[#3A3A3C] bg-[#2C2C2E] p-5 space-y-4 max-w-lg">
          <h2 className="text-lg font-semibold text-white">Нет доступа к камере</h2>
          <p className="text-sm text-white/60">
            Разрешите доступ к веб-камере в браузере для сканирования QR.
          </p>
          <Button
            onClick={() => requestPermission()}
            className="rounded-full bg-[#E25B21] hover:bg-[#D94F15] text-white gap-2"
          >
            <Camera className="h-4 w-4" />
            Выдать доступ
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#3A3A3C] bg-[#2C2C2E] p-5 max-w-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Сканирование QR</h2>
              <p className="text-sm text-white/60 mt-1">
                Наведите камеру на QR бронирования
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleRefresh()}
              className="border-white/20 text-white"
            >
              Обновить
            </Button>
          </div>
          <ExecutorInlineQrScanner enabled={!scanned} onScan={handleScanPayload} />
          {scanned ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleScanAgain}
              className="mt-4 rounded-full border-[#3A3A3C] bg-transparent text-white hover:bg-white/10"
            >
              Сканировать ещё раз
            </Button>
          ) : null}
        </div>
      )}
    </DesktopContentPage>
  );
}
