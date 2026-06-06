"use client";

import Link from "next/link";
import { AuthTextField } from "@/components/auth/auth-text-field";
import type { UseChangePasswordResult } from "@/hooks/use-change-password";

/** Desktop: смена пароля доступна в профиле; здесь — fallback-форма. */
export function ChangePasswordFormDesktop(props: UseChangePasswordResult) {
  const {
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
  } = props;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A] p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#2C2C2E] p-6 flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-white">Смена пароля</h1>
        <p className="text-sm text-white/60">
          На desktop пароль также можно изменить во вкладке «Пароль» в{" "}
          <Link href="/profile" className="text-[#E85D2B] hover:underline">
            профиле
          </Link>
          .
        </p>
        <AuthTextField
          id="old-password-desktop"
          label="Старый пароль"
          type="password"
          value={oldPassword}
          onChange={(e) => {
            setOldPassword(e.target.value);
            setPasswordError("");
          }}
        />
        <AuthTextField
          id="new-password-desktop"
          label="Новый пароль"
          type="password"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setPasswordError("");
          }}
        />
        <AuthTextField
          id="confirm-password-desktop"
          label="Подтверждение"
          type="password"
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
          className="flex h-12 items-center justify-center rounded-lg bg-[#E85D2B] text-base font-medium text-white disabled:opacity-50"
        >
          {isChanging ? "Смена..." : "Сменить пароль"}
        </button>
        {passwordError ? <p className="text-sm text-[#F35713]">{passwordError}</p> : null}
        {passwordSuccess ? <p className="text-sm text-green-500">{passwordSuccess}</p> : null}
      </div>
    </div>
  );
}
