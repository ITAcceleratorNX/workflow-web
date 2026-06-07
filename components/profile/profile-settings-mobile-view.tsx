"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, ChevronRight, Lock, Palette } from "lucide-react";
import { useColorScheme, setAppColorScheme } from "@/hooks/use-color-scheme";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";

/** Mobile settings — parity с workflow-mobile app/settings.tsx. */
export function ProfileSettingsMobileView() {
  const router = useRouter();
  const { toast } = useToast();
  const isGuest = useAuthStore((s) => s.isGuest);
  const colorScheme = useColorScheme();

  const handleGuest = (description: string) => {
    toast({ title: "Демо режим", description });
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex items-center px-4 pt-4 pb-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="min-w-11 min-h-11 flex items-center justify-center text-foreground"
          aria-label="Назад"
        >
          <ArrowLeft className="h-[22px] w-[22px]" />
        </button>
        <h1 className="flex-1 text-center text-xl font-semibold">Настройки</h1>
        <div className="w-[26px]" />
      </div>

      <div className="px-4 space-y-3">
        <Link
          href="/settings/notifications"
          onClick={(e) => {
            if (isGuest) {
              e.preventDefault();
              handleGuest("Настройки уведомлений недоступны в демо-версии.");
            }
          }}
          className="flex items-center gap-3 p-3.5 rounded-xl border border-border text-foreground hover:bg-muted/50"
        >
          <Bell className="h-[22px] w-[22px] text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium">Уведомления</p>
            <p className="text-[13px] text-muted-foreground">Email, безопасность и маркетинг</p>
          </div>
          <ChevronRight className="h-[22px] w-[22px] text-muted-foreground" />
        </Link>

        <Link
          href="/change-password"
          onClick={(e) => {
            if (isGuest) {
              e.preventDefault();
              handleGuest("Смена пароля недоступна в демо-версии.");
            }
          }}
          className="flex items-center gap-3 p-3.5 rounded-xl border border-border text-foreground hover:bg-muted/50"
        >
          <Lock className="h-[22px] w-[22px] text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium">Пароль</p>
            <p className="text-[13px] text-muted-foreground">Смена пароля аккаунта</p>
          </div>
          <ChevronRight className="h-[22px] w-[22px] text-muted-foreground" />
        </Link>

        <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border">
          <Palette className="h-[22px] w-[22px] text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium">Тема приложения</p>
            <p className="text-[13px] text-muted-foreground mb-3">Светлая или тёмная тема</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAppColorScheme("light")}
                className={cn(
                  "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                  colorScheme === "light"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:bg-muted/50"
                )}
              >
                Светлая
              </button>
              <button
                type="button"
                onClick={() => setAppColorScheme("dark")}
                className={cn(
                  "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                  colorScheme === "dark"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:bg-muted/50"
                )}
              >
                Тёмная
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
