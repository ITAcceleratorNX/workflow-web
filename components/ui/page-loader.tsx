"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface PageLoaderProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
  /**
   * 'overlay' — для PullToRefresh (конtrast на тёмном/светлом фоне).
   * 'default' — полноэкранная загрузка.
   */
  variant?: "default" | "overlay";
}

const LOGO_SRC = "/app-icon.png";

export function PageLoader({
  size = 80,
  className,
  style,
  variant = "default",
}: PageLoaderProps) {
  const ghostOpacity = variant === "overlay" ? "opacity-[0.35]" : "opacity-20 dark:opacity-[0.35]";
  const fillClass =
    variant === "overlay"
      ? "brightness-0 invert dark:invert"
      : "dark:brightness-0 dark:invert";

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size, ...style }}
      role="status"
      aria-label="Загрузка"
    >
      <div
        className="page-loader-spin relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <Image
          src={LOGO_SRC}
          alt=""
          width={size}
          height={size}
          className={cn("object-contain", ghostOpacity)}
          aria-hidden
          priority
        />
        <div
          className="page-loader-fill absolute bottom-0 left-0 right-0 overflow-hidden flex items-end justify-center"
          style={{ width: size }}
        >
          <Image
            src={LOGO_SRC}
            alt=""
            width={size}
            height={size}
            className={cn("object-contain", fillClass)}
            aria-hidden
            priority
          />
        </div>
      </div>
    </div>
  );
}
