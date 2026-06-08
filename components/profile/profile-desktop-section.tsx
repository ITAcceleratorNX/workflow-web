"use client";

import { CheckCircle2, Loader2, Lock, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogsViewer } from "@/components/logs-viewer";
import { ROLE_TRANSLATIONS } from "@/constants/profile";
import { useProfilePage } from "@/hooks/use-profile-page";

const sectionCl = "text-sm text-white/80";
const fieldCl =
  "text-sm bg-[#2C2C2E] border border-white/10 text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-[#E85D2B]/50 focus-visible:border-[#E85D2B] rounded-lg px-3 py-2.5";

/** Desktop profile section — сохраняет UI из ProfileModal asSection. */
export function ProfileDesktopSection() {
  const profile = useProfilePage();
  const {
    user,
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
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordError,
    isChangingPassword,
    isSavingProfile,
    profileError,
    profileSuccess,
    isSavingNotifications,
    notificationError,
    isLoggingOut,
    showEmailVerificationBlock,
    updateUser,
    handlePhoneChange,
    handleLogout,
    handleSaveProfile,
    handleChangePassword,
    handleSaveNotifications,
    handleSendVerificationCode,
    handleVerifyEmail,
  } = profile;

  const showLogsTab = ["admin-worker", "manager", "department-head"].includes(user?.role || "");

  if (!user) return null;

  return (
    <div className="w-full min-h-full px-4 py-6 md:px-6 md:py-8">
      <div className="w-full max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Профиль</h1>
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-transparent">
            <TabsTrigger
              value="profile"
              className="w-full rounded-md data-[state=active]:bg-[#E85D2B] data-[state=active]:text-white data-[state=inactive]:text-white/70 text-sm py-2"
            >
              Профиль
            </TabsTrigger>
            <TabsTrigger
              value="password"
              className="w-full rounded-md data-[state=active]:bg-[#E85D2B] data-[state=active]:text-white data-[state=inactive]:text-white/70 text-sm py-2"
            >
              Пароль
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="w-full rounded-md data-[state=active]:bg-[#E85D2B] data-[state=active]:text-white data-[state=inactive]:text-white/70 text-sm py-2"
            >
              Уведомления
            </TabsTrigger>
            {showLogsTab && (
              <TabsTrigger
                value="logs"
                className="w-full rounded-md data-[state=active]:bg-[#E85D2B] data-[state=active]:text-white data-[state=inactive]:text-white/70 text-sm py-2"
              >
                Логи
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="profile" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-5">
                <h2 className="text-base font-semibold text-white border-b border-white/10 pb-2">
                  Личные данные
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label className={sectionCl}>ФИО</Label>
                    <Input
                      value={user.full_name || ""}
                      onChange={(e) =>
                        updateUser((prev) => (prev ? { ...prev, full_name: e.target.value } : null))
                      }
                      className={fieldCl}
                    />
                  </div>
                  <div>
                    <Label className={sectionCl}>Телефон</Label>
                    <Input
                      type="tel"
                      value={user.phone || ""}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className={fieldCl}
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className={sectionCl}>Email</Label>
                      {user.email_verified && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-[#E85D2B]/20 text-[#E85D2B] border-0"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-0.5" /> Верифицирован
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        value={email || user.email || ""}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailError("");
                          setEmailSuccess("");
                        }}
                        className={`flex-1 ${fieldCl}`}
                        placeholder="example@mail.com"
                        disabled={isSendingCode || isVerifying}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSendVerificationCode}
                        disabled={
                          isSendingCode ||
                          isVerifying ||
                          (!email && !user.email) ||
                          (user.email_verified && (email || user.email) === user.email)
                        }
                        className="shrink-0 border-[#E85D2B]/50 text-[#E85D2B] hover:bg-[#E85D2B]/10"
                      >
                        {isSendingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : "Код"}
                      </Button>
                    </div>
                    {showEmailVerificationBlock && (
                      <div className="flex gap-2 mt-2">
                        <Input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => {
                            setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                            setEmailError("");
                          }}
                          className={`flex-1 ${fieldCl}`}
                          placeholder="Код из письма"
                          maxLength={6}
                          disabled={isVerifying}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleVerifyEmail}
                          disabled={isVerifying || verificationCode.length !== 6}
                          className="shrink-0 border-[#E85D2B]/50 text-[#E85D2B] hover:bg-[#E85D2B]/10"
                        >
                          {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "OK"}
                        </Button>
                      </div>
                    )}
                    {(emailError || emailSuccess) && (
                      <p className={`text-xs mt-1 text-[#E85D2B]`}>{emailError || emailSuccess}</p>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="bg-[#E85D2B] hover:bg-[#E85D2B]/90 text-white"
                >
                  {isSavingProfile ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isSavingProfile ? "Сохранение..." : "Сохранить"}
                </Button>
                {(profileError || profileSuccess) && (
                  <p className="text-sm text-[#E85D2B]">{profileError || profileSuccess}</p>
                )}
              </div>
              <div className="lg:pl-4 border-t border-white/10 lg:border-t-0 lg:border-l pt-6 lg:pt-0">
                <h2 className="text-base font-semibold text-white border-b border-white/10 pb-2 mb-4">
                  Информация
                </h2>
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-[#2C2C2E]/50 border border-white/10">
                  <div>
                    <Label className={sectionCl}>Роль</Label>
                    <p className="text-white font-medium mt-1">
                      {ROLE_TRANSLATIONS[user.role] || user.role}
                    </p>
                  </div>
                  <div>
                    <Label className={sectionCl}>Офис</Label>
                    <p className="text-white font-medium mt-1">{user.office?.name || "—"}</p>
                  </div>
                  <div>
                    <Label className={sectionCl}>ID</Label>
                    <p className="text-white/70 font-mono text-sm mt-1">#{user.id}</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="password" className="mt-0 space-y-6">
            <div className="max-w-md p-6 rounded-xl bg-[#2C2C2E]/50 border border-white/10 space-y-5">
              <h2 className="text-base font-semibold text-white border-b border-white/10 pb-2">
                Смена пароля
              </h2>
              <div className="space-y-4">
                <div>
                  <Label className={sectionCl}>Старый пароль</Label>
                  <Input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className={fieldCl}
                  />
                </div>
                <div>
                  <Label className={sectionCl}>Новый пароль</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={fieldCl}
                  />
                </div>
                <div>
                  <Label className={sectionCl}>Подтверждение</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={fieldCl}
                  />
                </div>
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="bg-[#E85D2B] hover:bg-[#E85D2B]/90 text-white"
              >
                <Lock className="h-4 w-4 mr-2" />
                {isChangingPassword ? "Смена..." : "Сменить пароль"}
              </Button>
              {passwordError && <p className="text-sm text-[#E85D2B]">{passwordError}</p>}
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="mt-0 space-y-6">
            <div className="max-w-xl p-6 rounded-xl bg-[#2C2C2E]/50 border border-white/10 space-y-4">
              <h2 className="text-base font-semibold text-white border-b border-white/10 pb-2">
                Уведомления
              </h2>
              <div className="space-y-1">
                {(
                  [
                    ["email_notifications", "Email уведомления"],
                    ["security_notifications", "Безопасность"],
                    ["marketing_notifications", "Маркетинг"],
                  ] as const
                ).map(([key, label]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-3 px-4 rounded-lg bg-[#1A1A1A]/50 border border-white/5"
                  >
                    <Label className={sectionCl}>{label}</Label>
                    <Switch
                      checked={user[key] ?? false}
                      onCheckedChange={(checked) =>
                        updateUser((prev) => (prev ? { ...prev, [key]: checked } : null))
                      }
                      className="data-[state=unchecked]:bg-[#1A1A1A] data-[state=checked]:bg-[#E85D2B]"
                    />
                  </div>
                ))}
              </div>
              <Button
                onClick={handleSaveNotifications}
                disabled={isSavingNotifications}
                className="bg-[#E85D2B] hover:bg-[#E85D2B]/90 text-white mt-2"
              >
                {isSavingNotifications ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSavingNotifications ? "Сохранение..." : "Сохранить"}
              </Button>
              {notificationError && <p className="text-sm text-[#E85D2B]">{notificationError}</p>}
            </div>
          </TabsContent>

          {showLogsTab && (
            <TabsContent value="logs" className="mt-0">
              <div className="p-6 rounded-xl bg-[#2C2C2E]/50 border border-white/10">
                <h2 className="text-base font-semibold text-white border-b border-white/10 pb-2 mb-4">
                  История операций
                </h2>
                <LogsViewer userRole={user.role || "admin-worker"} isDesktop dark />
              </div>
            </TabsContent>
          )}
        </Tabs>
        <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-white/70 hover:text-[#E85D2B] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#E85D2B]/10"
          >
            {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin inline mr-1" /> : null}
            {isLoggingOut ? "Выходим..." : "Выйти из аккаунта"}
          </button>
        </div>
      </div>
    </div>
  );
}
