"use client";

import { useExecutorScanQr } from "@/hooks/use-executor-scan-qr";
import { ExecutorScanQrMobile } from "./executor-scan-qr-mobile";

export function ExecutorScanQrView() {
  const state = useExecutorScanQr();

  if (state.isDesktop) {
    return null;
  }

  return <ExecutorScanQrMobile {...state} />;
}
