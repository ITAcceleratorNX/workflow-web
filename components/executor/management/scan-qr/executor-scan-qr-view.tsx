"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { useExecutorScanQr } from "@/hooks/use-executor-scan-qr";
import { ExecutorScanQrDesktop } from "./executor-scan-qr-desktop";
import { ExecutorScanQrMobile } from "./executor-scan-qr-mobile";

export function ExecutorScanQrView() {
  const isDesktop = useIsDesktop();
  const state = useExecutorScanQr();

  if (isDesktop) {
    return <ExecutorScanQrDesktop {...state} />;
  }

  return <ExecutorScanQrMobile {...state} />;
}
