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
        <div className="rounded-xl border border-[#212121] p-5 flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-white">Новый пароль</h2>
          <AuthTextField
            id="old-password"
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
            id="new-password"
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
            id="confirm-password"
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
            className="flex h-12 items-center justify-center rounded-lg bg-[#F35713] text-base font-medium text-white disabled:opacity-50"
          >
            {isChanging ? "Смена..." : "Сменить пароль"}
          </button>
          {passwordError ? (
            <p className="text-sm text-[#F35713]">{passwordError}</p>
          ) : null}
          {passwordSuccess ? (
            <p className="text-sm text-green-500">{passwordSuccess}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
