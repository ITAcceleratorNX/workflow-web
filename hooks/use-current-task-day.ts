"use client";

import { useEffect, useState } from "react";
import { todayTaskDateKey } from "@/lib/dateTimeUtils";
import { millisecondsUntilNextTaskDay } from "@/lib/task-day-clock";


export function useCurrentTaskDay(): string {
  const [dayKey, setDayKey] = useState(todayTaskDateKey);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const synchronize = () => {
      clearTimeout(timer);
      setDayKey(todayTaskDateKey());
      timer = setTimeout(synchronize, millisecondsUntilNextTaskDay(new Date()));
    };
    synchronize();
    const onVisible = () => { if (document.visibilityState === "visible") synchronize(); };
    window.addEventListener("focus", synchronize);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", synchronize);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return dayKey;
}
