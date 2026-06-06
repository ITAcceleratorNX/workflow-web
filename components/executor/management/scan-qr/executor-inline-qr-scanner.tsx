"use client";

import { useEffect, useId, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface ExecutorInlineQrScannerProps {
  enabled: boolean;
  onScan: (payload: string) => void;
}

/** Inline QR scanner — parity с RN CameraView в карточке. */
export function ExecutorInlineQrScanner({ enabled, onScan }: ExecutorInlineQrScannerProps) {
  const reactId = useId();
  const scannerId = `executor-inline-qr-${reactId.replace(/:/g, "")}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const stoppingRef = useRef(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      const stop = async () => {
        if (stoppingRef.current || !scannerRef.current) return;
        stoppingRef.current = true;
        const scanner = scannerRef.current;
        try {
          await scanner.stop();
        } catch {
          // already stopped
        }
        try {
          scanner.clear();
        } catch {
          // ignore
        }
        scannerRef.current = null;
        stoppingRef.current = false;
      };
      stop();
      return;
    }

    let cancelled = false;

    const stopScanner = async () => {
      if (stoppingRef.current || !scannerRef.current) return;
      stoppingRef.current = true;
      const scanner = scannerRef.current;
      try {
        await scanner.stop();
      } catch {
        // already stopped
      }
      try {
        scanner.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
      stoppingRef.current = false;
    };

    const startScanner = async () => {
      await stopScanner();
      if (cancelled) return;

      const element = document.getElementById(scannerId);
      if (!element) return;

      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;

      const configs: Array<string | { facingMode: string }> = [
        { facingMode: "environment" },
        { facingMode: "user" },
      ];

      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices.length > 0) {
          configs.push(devices[0].id);
        }
      } catch {
        // use facingMode only
      }

      for (const cameraIdOrConfig of configs) {
        if (cancelled) return;
        try {
          await html5QrCode.start(
            cameraIdOrConfig,
            {
              fps: 10,
              qrbox: { width: 220, height: 220 },
              aspectRatio: 1,
            },
            (decodedText) => {
              onScanRef.current(decodedText);
            },
            () => {
              // ignore scan errors while searching
            }
          );
          return;
        } catch {
          try {
            await html5QrCode.stop();
          } catch {
            // ignore
          }
        }
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [enabled, scannerId]);

  return (
    <div className="mt-3 rounded-2xl overflow-hidden h-[260px] bg-black relative">
      <div id={scannerId} className="w-full h-full" />
    </div>
  );
}
