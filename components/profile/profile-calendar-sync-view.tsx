"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsDesktop } from "@/hooks/use-media-query";
import { calendarResultNotice } from "@/lib/task-calendar";
import { TaskCalendarSettings } from "@/components/profile/task-calendar-settings";

/** Страница «Календарь» (/settings/calendar) — сюда же Google возвращает после подключения. */
export function ProfileCalendarSyncView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const isDesktop = useIsDesktop();

  // Возврат от Google: показать итог и убрать параметр из адреса.
  const result = searchParams.get("calendar");
  useEffect(() => {
    const notice = calendarResultNotice(result);
    if (!result) return;
    if (notice) {
      toast({
        title: notice.title,
        description: notice.description,
        variant: notice.tone,
      });
    }
    router.replace(pathname ?? "/settings/calendar");
  }, [result, pathname, router, toast]);

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex items-center px-4 pt-4 pb-3">
        <button
          type="button"
          // На компьютере настройки — вкладка профиля, на телефоне — экран /settings.
          onClick={() => router.push(isDesktop ? "/profile?tab=settings" : "/settings")}
          className="min-w-11 min-h-11 flex items-center justify-center text-foreground"
          aria-label="Назад"
        >
          <ArrowLeft className="h-[22px] w-[22px]" />
        </button>
        <h1 className="flex-1 text-center text-xl font-semibold">Календарь</h1>
        <div className="w-[26px]" />
      </div>

      <div className="mx-auto w-full max-w-[420px] px-4">
        <TaskCalendarSettings />
      </div>
    </div>
  );
}
