"use client";

import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobilePageLayout } from "@/components/layout/MobilePageLayout";
import { EXECUTOR_MANAGEMENT_TASKS_BACK_HREF } from "@/hooks/use-executor-management-tasks";
import type { UseExecutorScanQrResult } from "@/hooks/use-executor-scan-qr";
import { ExecutorInlineQrScanner } from "./executor-inline-qr-scanner";

type ExecutorScanQrMobileProps = UseExecutorScanQrResult;

/** Mobile scan flow — parity с workflow-mobile/app/executor/scan-qr.tsx */
export function ExecutorScanQrMobile({
  permissionState,
  scanned,
  handleScanPayload,
  handleScanAgain,
  handleRefresh,
  requestPermission,
}: ExecutorScanQrMobileProps) {
  return (
    <MobilePageLayout
      title="QR сканер"
      onRefresh={handleRefresh}
      backHref={EXECUTOR_MANAGEMENT_TASKS_BACK_HREF}
      gradient="plain"
    >
      {permissionState === "loading" ? (
        <div className="rounded-2xl border border-[#3A3A3C] bg-[#2C2C2E] p-5">
          <p className="text-sm text-white/60">Запрос доступа к камере…</p>
        </div>
      ) : permissionState === "denied" ? (
        <div className="rounded-2xl border border-[#3A3A3C] bg-[#2C2C2E] p-5 space-y-4">
          <h2 className="text-lg font-semibold text-white">Нет доступа к камере</h2>
          <Button
            onClick={() => requestPermission()}
            className="rounded-full bg-[#E25B21] hover:bg-[#D94F15] text-white gap-2"
          >
            <Camera className="h-4 w-4" />
            Выдать доступ
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#3A3A3C] bg-[#2C2C2E] p-5">
          <h2 className="text-lg font-semibold text-white mb-2">Сканирование QR кода</h2>
          <p className="text-sm text-white/60 mb-1">
            Наведите камеру на QR код бронирования, чтобы уменьшить количество столов.
          </p>

          <ExecutorInlineQrScanner enabled={!scanned} onScan={handleScanPayload} />

          {scanned ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleScanAgain}
              className="mt-3 rounded-full border-[#3A3A3C] bg-transparent text-white hover:bg-white/10"
            >
              Сканировать ещё раз
            </Button>
          ) : null}
        </div>
      )}
    </MobilePageLayout>
  );
}
