"use client";

import { AuthTextField } from "@/components/auth/auth-text-field";
import { ScreenHeader } from "@/components/ui/screen-header";
import type { UseChangePasswordResult } from "@/hooks/use-change-password";

/** Mobile change password — parity с workflow-mobile/app/change-password.tsx */
export function ChangePasswordFormMobile({
  oldPassword,
  setOldPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  passwordError,
  setPasswordError,
  passwordSuccess,
  isChanging,
  handleChangePassword,
  handleBack,
}: UseChangePasswordResult) {
  return (
    <div className="min-h-screen flex flex-col bg-background safe-area-bottom">
      <ScreenHeader
        title="Смена пароля"
        onBack={handleBack}
        inlineTitle
        hideBackLabel
      />
      <div className="flex-1 px-4 pb-8 pt-4">
        <div className="rounded-xl border border-input p-5 flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-foreground">Новый пароль</h2>
          <AuthTextField
            id="change-mobile-old-password"
            autoComplete="current-password"
            label="Старый пароль"
            type="password"
            placeholder="••••••••"
            value={oldPassword}
            onChange={(e) => {
              setOldPassword(e.target.value);
              setPasswordError("");
            }}
          />
          <AuthTextField
            id="change-mobile-new-password"
            autoComplete="new-password"
            label="Новый пароль"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setPasswordError("");
            }}
          />
          <AuthTextField
            id="change-mobile-confirm-password"
            autoComplete="new-password"
            label="Подтверждение"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setPasswordError("");
            }}
          />
          <button
            type="button"
            onClick={() => void handleChangePassword()}
            disabled={isChanging}
            className="flex min-h-12 px-4 py-3 items-center justify-center rounded-lg bg-[hsl(var(--action-background))] text-base font-medium text-white disabled:opacity-50"
          >
            {isChanging ? "Смена..." : "Сменить пароль"}
          </button>
          {passwordError ? (
            <p className="text-sm text-red-700 dark:text-red-400">{passwordError}</p>
          ) : null}
          {passwordSuccess ? (
            <p className="text-sm text-green-500">{passwordSuccess}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
