"use client";

import { useEffect, useState } from "react";

function clamp01(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

interface ProgressDonutProps {
  size: number;
  strokeWidth: number;
  progress: number;
  color: string;
  trackColor: string;
  label: string;
  subtitle: string;
}

export function ProgressDonut({
  size,
  strokeWidth,
  progress,
  color,
  trackColor,
  label,
  subtitle,
}: ProgressDonutProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;
  const percent = Math.round(clamp01(animatedProgress) * 100);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimatedProgress(clamp01(progress)));
    return () => cancelAnimationFrame(frame);
  }, [progress]);

  return (
    <div className="flex flex-col items-center min-w-[100px] shrink-0">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - clamp01(animatedProgress))}
            className="transition-[stroke-dashoffset] duration-[950ms] ease-out"
          />
        </svg>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ width: size, height: size }}
        >
          <span className="text-xl font-extrabold tabular-nums text-foreground">{percent}%</span>
          <span className="text-[11px] font-semibold text-muted-foreground mt-0.5 truncate max-w-[80px]">
            {subtitle}
          </span>
        </div>
      </div>
      <span className="mt-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

interface StatBarProps {
  label: string;
  completed: number;
  total: number;
  color: string;
  trackColor: string;
}

export function StatBar({ label, completed, total, color, trackColor }: StatBarProps) {
  const ratio = clamp01(total > 0 ? completed / total : 0);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setWidth(ratio * 100));
    return () => cancelAnimationFrame(frame);
  }, [ratio]);

  return (
    <div className="mb-[18px] last:mb-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[15px] font-bold text-foreground">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-muted-foreground">
          {completed} из {total}
        </span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden w-full" style={{ backgroundColor: trackColor }}>
        <div
          className="h-full rounded-full transition-[width] duration-[900ms] ease-out"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
