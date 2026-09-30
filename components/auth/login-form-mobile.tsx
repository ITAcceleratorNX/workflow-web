"use client";

import Link from "next/link";
import type { UseLoginResult } from "@/hooks/use-login";
import { AuthTextField } from "@/components/auth/auth-text-field";

type LoginFormMobileProps = Pick<
  UseLoginResult,
  | "phone"
  | "password"
  | "phoneError"
  | "passwordError"
  | "formError"
  | "loading"
  | "handlePhoneChange"
  | "handlePasswordChange"
  | "handleLogin"
  | "handleRegister"
  | "handleGuestLogin"
>;

/** Mobile login — parity с workflow-mobile/app/login/index.tsx */
export function LoginFormMobile({
  phone,
  password,
  phoneError,
  passwordError,
  formError,
  loading,
  handlePhoneChange,
  handlePasswordChange,
  handleLogin,
  handleRegister,
  handleGuestLogin,
}: LoginFormMobileProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background safe-area-top safe-area-bottom">
      <div className="flex flex-1 flex-col justify-center px-5 py-8">
        <header className="mb-12 flex flex-col gap-3">
          <h1 id="login-mobile-heading" className="text-[28px] font-semibold leading-10 text-foreground">Вход</h1>
          <p className="text-lg leading-[26px] text-muted-foreground">
            Войдите в свою учетную запись
          </p>
        </header>

        <form
          aria-labelledby="login-mobile-heading"
          aria-busy={loading}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!loading) void handleLogin();
          }}
          className="flex flex-col gap-6"
        >
          <AuthTextField
            id="login-mobile-phone"
            name="phone"
            autoComplete="username"
            label="Номер телефона"
            type="tel"
            placeholder="+7 XXX XXX XX XX"
            value={phone}
            onChange={handlePhoneChange}
            maxLength={19}
            error={phoneError}
            inputMode="tel"
          />

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="login-mobile-password" className="text-base font-medium leading-6 text-foreground">
                Пароль
              </label>
              <Link
                href="/reset-password"
                className="rounded-sm py-2 text-xs font-medium leading-6 text-[#B8400E] dark:text-[#F59A71] focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
              >
                Забыли пароль?
              </Link>
            </div>
            <AuthTextField
              id="login-mobile-password"
              name="password"
              autoComplete="current-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={handlePasswordChange}
              error={passwordError}
              hideLabel
            />
          </div>

          {formError ? (
            <p role="alert" className="text-center text-sm text-red-700 dark:text-red-400">{formError}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="flex min-h-12 w-full items-center justify-center rounded-lg bg-[hsl(var(--action-background))] px-4 py-3 text-base font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
          >
            {loading ? "Вход..." : "Войти"}
          </button>

          <button
            type="button"
            onClick={handleRegister}
            className="flex min-h-12 w-full items-center justify-center rounded-lg bg-sky-100 px-4 py-3 text-base font-normal text-sky-800 dark:bg-sky-950 dark:text-sky-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Запросить регистрацию
          </button>

          <button
            type="button"
            onClick={handleGuestLogin}
            className="flex min-h-12 w-full items-center justify-center rounded-lg border border-input bg-transparent px-4 py-3 text-base font-normal text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Открыть демо-режим
          </button>

          <Link
            href="/privacy"
            className="rounded-sm py-2 text-center text-base text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
          >
            Политика конфиденциальности
          </Link>
        </form>
      </div>
    </div>
  );
}
