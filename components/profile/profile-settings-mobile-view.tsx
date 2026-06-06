"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, ChevronRight, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/useAuthStore";

/** Mobile settings — parity с workflow-mobile app/settings.tsx. */
export function ProfileSettingsMobileView() {
  const router = useRouter();
  const { toast } = useToast();
  const isGuest = useAuthStore((s) => s.isGuest);

  const handleGuest = (description: string) => {
    toast({ title: "Демо режим", description });
  };

  return (
    <div
      className="min-h-screen bg-[#040404]"
      style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex items-center px-4 pt-4 pb-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="min-w-11 min-h-11 flex items-center justify-center text-white"
          aria-label="Назад"
        >
          <ArrowLeft className="h-[22px] w-[22px]" />
        </button>
        <h1 className="flex-1 text-center text-xl font-semibold text-white">Настройки</h1>
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
          className="flex items-center gap-3 p-3.5 rounded-xl border border-[#3A3A3C] text-white hover:bg-white/5"
        >
          <Bell className="h-[22px] w-[22px] text-[#F35713] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium">Уведомления</p>
            <p className="text-[13px] text-[#8E8E93]">Email, безопасность и маркетинг</p>
          </div>
          <ChevronRight className="h-[22px] w-[22px] text-[#8E8E93]" />
        </Link>

        <Link
          href="/change-password"
          onClick={(e) => {
            if (isGuest) {
              e.preventDefault();
              handleGuest("Смена пароля недоступна в демо-версии.");
            }
          }}
          className="flex items-center gap-3 p-3.5 rounded-xl border border-[#3A3A3C] text-white hover:bg-white/5"
        >
          <Lock className="h-[22px] w-[22px] text-[#F35713] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium">Пароль</p>
            <p className="text-[13px] text-[#8E8E93]">Смена пароля аккаунта</p>
          </div>
          <ChevronRight className="h-[22px] w-[22px] text-[#8E8E93]" />
        </Link>
      </div>
    </div>
  );
}
