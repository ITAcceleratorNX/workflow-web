"use client";

import Link from "next/link";
import {
  RESET_PASSWORD_STEP_SUBTITLES,
  RESET_PASSWORD_STEP_TITLES,
  RESET_PASSWORD_SUCCESS_MESSAGE,
} from "@/constants/reset-password";
import { AuthOtpInput } from "@/components/auth/otp-input";
import { AuthTextField } from "@/components/auth/auth-text-field";
import type { UseResetPasswordResult } from "@/hooks/use-reset-password";

/** Mobile reset password — parity с workflow-mobile/app/reset-password/index.tsx */
export function ResetPasswordFormMobile(props: UseResetPasswordResult) {
  const {
    step,
    phone,
    verificationCode,
    setVerificationCode,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    isSendingCode,
    countdown,
    error,
    setError,
    isPhoneValid,
    handlePhoneChange,
    handleSendVerificationCode,
    handleVerifyCode,
    handleResendCode,
    handleResetPassword,
    goBackToPhone,
    goBackToOtp,
  } = props;

  return (
    <div className="min-h-screen flex flex-col bg-background safe-area-top safe-area-bottom">
      <div className="flex flex-1 flex-col justify-center px-5 py-8">
        <header className="mb-6 flex flex-col gap-2 text-center">
          <h1 className="text-[28px] font-bold leading-10 text-white">
            {RESET_PASSWORD_STEP_TITLES[step - 1]}
          </h1>
          <p className="text-base text-[#7F7F7F]">
            {RESET_PASSWORD_STEP_SUBTITLES[step - 1]}
          </p>
        </header>

        <div className="rounded-xl border border-[#212121] p-4 flex flex-col gap-3">
          {step === 1 && (
            <>
              <AuthTextField
                id="phone"
                label="Номер телефона"
                type="tel"
                placeholder="+7 XXX XXX XX XX"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={19}
                inputMode="tel"
              />
              {error ? <p className="text-sm text-[#F35713]">{error}</p> : null}
              <button
                type="button"
                onClick={() => void handleSendVerificationCode()}
                disabled={isSendingCode || !isPhoneValid}
                className="flex h-12 items-center justify-center rounded-lg bg-[#F35713] text-base font-semibold text-white disabled:opacity-50"
              >
                {isSendingCode ? "Отправка..." : "Отправить код"}
              </button>
              <Link
                href="/login"
                className="flex h-12 items-center justify-center rounded-lg border border-[#212121] text-base font-medium text-[#7F7F7F]"
              >
                Вернуться к входу
              </Link>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-center text-sm leading-5 text-[#7F7F7F]">
                Мы отправили SMS с кодом верификации на номер {phone}
              </p>
              <AuthOtpInput
                variant="mobile"
                label="Введите код из SMS"
                value={verificationCode}
                onChange={(v) => {
                  setVerificationCode(v);
                  setError("");
                }}
              />
              {error ? <p className="text-sm text-[#F35713]">{error}</p> : null}
              <button
                type="button"
                onClick={() => void handleVerifyCode()}
                disabled={verificationCode.length !== 6}
                className="flex h-12 items-center justify-center rounded-lg bg-[#F35713] text-base font-semibold text-white disabled:opacity-50"
              >
                Подтвердить
              </button>
              <button
                type="button"
                onClick={() => void handleResendCode()}
                disabled={isSendingCode || countdown > 0}
                className="flex h-12 items-center justify-center rounded-lg border border-[#212121] text-base text-[#7F7F7F] disabled:opacity-50"
              >
                {isSendingCode
                  ? "Отправка..."
                  : countdown > 0
                    ? `Отправить повторно (${countdown}с)`
                    : "Отправить код повторно"}
              </button>
              <button
                type="button"
                onClick={goBackToPhone}
                className="flex h-12 items-center justify-center text-base text-[#7F7F7F]"
              >
                Назад
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <AuthTextField
                id="new-password"
                label="Новый пароль"
                type="password"
                placeholder="Минимум 6 символов"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError("");
                }}
              />
              <AuthTextField
                id="confirm-password"
                label="Подтвердите пароль"
                type="password"
                placeholder="Повторите пароль"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
              />
              {error ? <p className="text-sm text-[#F35713]">{error}</p> : null}
              <button
                type="button"
                onClick={() => void handleResetPassword()}
                disabled={loading}
                className="flex h-12 items-center justify-center rounded-lg bg-[#F35713] text-base font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Сохранение..." : "Изменить пароль"}
              </button>
              <button
                type="button"
                onClick={goBackToOtp}
                className="flex h-12 items-center justify-center text-base text-[#7F7F7F]"
              >
                Назад
              </button>
            </>
          )}

          {step === 4 && (
            <>
              <p className="text-center text-5xl font-bold text-[#F35713]">✓</p>
              <p className="text-center text-sm leading-5 text-[#7F7F7F]">
                {RESET_PASSWORD_SUCCESS_MESSAGE}
              </p>
              <Link
                href="/login"
                className="flex h-12 items-center justify-center rounded-lg bg-[#F35713] text-base font-semibold text-white"
              >
                Перейти к входу
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
