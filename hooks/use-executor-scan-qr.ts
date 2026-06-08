"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { scanBookingQRCode } from "@/lib/api";
import { parseBookingIdFromQrPayload } from "@/lib/booking-qr";
import { useToast } from "@/hooks/use-toast";

export type ExecutorScanQrPermissionState = "loading" | "denied" | "granted";

export function useExecutorScanQr() {
  const { toast } = useToast();
  const [permissionState, setPermissionState] = useState<ExecutorScanQrPermissionState>("loading");
  const [scanned, setScanned] = useState(false);
  const processingRef = useRef(false);

  const probeCameraPermission = useCallback(async () => {
    setPermissionState("loading");
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
        stream.getTracks().forEach((track) => track.stop());
        setPermissionState("granted");
        return;
      }
      const devices = await Html5Qrcode.getCameras();
      setPermissionState(devices.length > 0 ? "granted" : "denied");
    } catch {
      setPermissionState("denied");
    }
  }, []);

  useEffect(() => {
    probeCameraPermission();
  }, [probeCameraPermission]);

  const handleScanPayload = useCallback(
    async (payload: string) => {
      const trimmed = payload.trim();
      if (!trimmed || processingRef.current) return;

      processingRef.current = true;
      setScanned(true);

      try {
        const bookingId = parseBookingIdFromQrPayload(trimmed);
        if (bookingId === undefined) {
          throw new Error("В QR нет ID бронирования. Покажите QR с экрана бронирования.");
        }

        const response = await scanBookingQRCode(bookingId);
        toast({
          title: "QR обработан",
          description: `Столов осталось: ${response.data.tables_remaining}`,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Ошибка при обработке QR";
        toast({
          title: "Ошибка",
          description: message,
          variant: "destructive",
        });
      } finally {
        setTimeout(() => {
          processingRef.current = false;
          setScanned(false);
        }, 2000);
      }
    },
    [toast]
  );

  const handleScanAgain = useCallback(() => {
    processingRef.current = false;
    setScanned(false);
  }, []);

  const handleRefresh = useCallback(async () => {
    processingRef.current = false;
    setScanned(false);
    await probeCameraPermission();
  }, [probeCameraPermission]);

  return {
    permissionState,
    scanned,
    handleScanPayload,
    handleScanAgain,
    handleRefresh,
    requestPermission: probeCameraPermission,
  };
}

export type UseExecutorScanQrResult = ReturnType<typeof useExecutorScanQr>;
