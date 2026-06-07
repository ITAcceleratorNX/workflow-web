"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Edit3,
  Loader2,
  Mail,
  Phone,
  Settings,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogsViewer } from "@/components/logs-viewer";
import { ROLE_TRANSLATIONS, type ProfileTab } from "@/constants/profile";
import { MOBILE_BOTTOM_NAV_PADDING } from "@/constants/mobile-layout";
import type { UseProfilePageResult } from "@/hooks/use-profile-page";
import { ProfileTabs } from "./profile-tabs";

type ProfileMobileViewProps = UseProfilePageResult & {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
};

/** Mobile profile — parity с workflow-mobile app/(tabs)/profile.tsx. */
export function ProfileMobileView({
  activeTab,
  onTabChange,
  user,
  role,
  isEditingProfile,
  setIsEditingProfile,
  email,
  setEmail,
  verificationCode,
  setVerificationCode,
  isSendingCode,
  isVerifying,
  emailError,
  emailSuccess,
  setEmailError,
  setEmailSuccess,
  isSavingProfile,
  profileError,
  profileSuccess,
  isLoggingOut,
  showEmailVerificationBlock,
  updateUser,
  handlePhoneChange,
  handleLogout,
  handleSaveProfile,
  handleSendVerificationCode,
  handleVerifyEmail,
}: ProfileMobileViewProps) {
  if (!user) return null;

  const inputClass =
    "h-12 rounded-lg border border-[#212121] bg-transparent px-4 text-base text-white placeholder:text-[#6E6E6E] focus-visible:ring-2 focus-visible:ring-[#212121]";
  const labelClass = "text-[15px] font-medium text-white";

  return (
    <div
      className="min-h-screen bg-[#040404]"
      style={{ paddingBottom: MOBILE_BOTTOM_NAV_PADDING }}
    >
      <div className="mx-auto w-full max-w-[420px] px-5 pt-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] leading-10 font-semibold text-white">Профиль</h1>
          <Link
            href="/settings"
            className="p-2 text-white hover:text-[#F35713] transition-colors"
            aria-label="Настройки"
          >
            <Settings className="h-[22px] w-[22px]" />
          </Link>
        </div>

        <ProfileTabs activeTab={activeTab} onTabChange={onTabChange} role={role} />

        {activeTab === "profile" && !isEditingProfile && (
          <>
            <div>
              <p className="text-[22px] font-semibold text-white">{user.full_name || "—"}</p>
              <p className="text-[15px] text-[#8E8E93] mt-1">
                {(role && ROLE_TRANSLATIONS[role]) || role || "—"}
              </p>
            </div>

            <div className="divide-y divide-[#3A3A3C] border-y border-[#3A3A3C]">
              <InfoRow icon={<Phone className="h-[22px] w-[22px]" />} label="Телефон" value={user.phone || "—"} />
              <InfoRow
                icon={<Mail className="h-[22px] w-[22px]" />}
                label="Email"
                value={user.email || "—"}
                verified={user.email_verified}
              />
              {role !== "admin-worker" && (
                <InfoRow
                  icon={<Building2 className="h-[22px] w-[22px]" />}
                  label="Офис"
                  value={user.office?.name ?? "—"}
                />
              )}
              {role === "client" && (
                <InfoRow
                  icon={<Building2 className="h-[22px] w-[22px]" />}
                  label="Компания"
                  value={user.company?.name ?? "Не указана"}
                />
              )}
              <InfoRow icon={<Tag className="h-[22px] w-[22px]" />} label="ID" value={`#${user.id}`} muted />
            </div>

            <button
              type="button"
              onClick={() => setIsEditingProfile(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] border-[1.5px] border-[#F35713] text-[#F35713] font-semibold"
            >
              <Edit3 className="h-5 w-5" />
              Редактировать профиль
            </button>

            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full h-12 rounded-lg border border-[#212121] bg-[#212121] text-[#A3A3A3] hover:bg-[#2a2a2a] hover:text-white"
            >
              {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isLoggingOut ? "Выходим..." : "Выйти из аккаунта"}
            </Button>
          </>
        )}

        {activeTab === "profile" && isEditingProfile && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Редактирование профиля</h2>
              <p className="text-sm text-[#8E8E93]">Измените данные и нажмите «Сохранить»</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className={labelClass}>ФИО</Label>
                <Input
                  value={user.full_name || ""}
                  onChange={(e) =>
                    updateUser((prev) => (prev ? { ...prev, full_name: e.target.value } : null))
                  }
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Номер телефона</Label>
                <Input
                  type="tel"
                  value={user.phone || ""}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className={inputClass}
                  placeholder="+7 XXX XXX XX XX"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className={labelClass}>Email</Label>
                  {user.email_verified && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                </div>
                <Input
                  type="email"
                  value={email || user.email || ""}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                    setEmailSuccess("");
                  }}
                  className={inputClass}
                  disabled={isSendingCode || isVerifying}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendVerificationCode}
                  disabled={
                    isSendingCode ||
                    isVerifying ||
                    (!email && !user.email) ||
                    (user.email_verified && (email || user.email) === user.email)
                  }
                  className="h-10 border-[#3A3A3C] text-white"
                >
                  {isSendingCode ? "Отправка..." : "Код"}
                </Button>
                {emailSuccess && <p className="text-xs text-green-400">{emailSuccess}</p>}
                {emailError && <p className="text-xs text-[#F35713]">{emailError}</p>}
                {showEmailVerificationBlock && (
                  <div className="flex gap-2">
                    <Input
                      value={verificationCode}
                      onChange={(e) => {
                        setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                        setEmailError("");
                      }}
                      className={inputClass}
                      placeholder="000000"
                      maxLength={6}
                    />
                    <Button
                      onClick={handleVerifyEmail}
                      disabled={isVerifying || verificationCode.length !== 6}
                      className="bg-[#F35713]"
                    >
                      OK
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-[#3A3A3C] text-white"
                onClick={() => {
                  setIsEditingProfile(false);
                }}
              >
                Отмена
              </Button>
              <Button
                className="flex-1 bg-[#F35713]"
                disabled={isSavingProfile}
                onClick={async () => {
                  const ok = await handleSaveProfile();
                  if (ok) setIsEditingProfile(false);
                }}
              >
                {isSavingProfile ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
            {profileError && <p className="text-sm text-[#F35713]">{profileError}</p>}
            {profileSuccess && <p className="text-sm text-green-400">{profileSuccess}</p>}
          </div>
        )}

        {activeTab === "logs" && role && ROLES_WITH_LOGS.includes(role as (typeof ROLES_WITH_LOGS)[number]) && (
          <div className="rounded-xl border border-[#212121] p-5">
            <h2 className="text-lg font-semibold text-white mb-2">Логи действий</h2>
            <LogsViewer userRole={role} isDesktop={false} dark />
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  verified,
  muted,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  verified?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-4 min-h-[52px]">
      <span className="text-[#8E8E93] shrink-0">{icon}</span>
      <span className="text-[15px] text-[#8E8E93] min-w-[72px]">{label}</span>
      <span
        className={`flex-1 text-right text-base font-medium truncate ${muted ? "text-[#8E8E93] font-mono text-sm" : "text-white"}`}
      >
        {value}
      </span>
      {verified && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
    </div>
  );
}
