"use client";

import Link from "next/link";
import { Eye, EyeOff, User, UserPlus } from "lucide-react";
import type { UseLoginResult } from "@/hooks/use-login";

type LoginFormDesktopProps = Pick<
  UseLoginResult,
  | "phone"
  | "password"
  | "phoneError"
  | "passwordError"
  | "formError"
  | "loading"
  | "showPassword"
  | "handlePhoneChange"
  | "handlePasswordChange"
  | "toggleShowPassword"
  | "handleLogin"
  | "handleRegister"
  | "handleGuestLogin"
>;

/** Desktop login form (≥768px), with native form submission and field semantics. */
export function LoginFormDesktop({
  phone,
  password,
  phoneError,
  passwordError,
  formError,
  loading,
  showPassword,
  handlePhoneChange,
  handlePasswordChange,
  toggleShowPassword,
  handleLogin,
  handleRegister,
  handleGuestLogin,
}: LoginFormDesktopProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center"
      style={{ background: "#040404" }}
    >
      <div
        className="flex flex-col px-5 pt-[124px] md:pt-[15vh] w-full md:max-w-[420px]"
        style={{ gap: "48px" }}
      >
        <div className="flex flex-col" style={{ gap: "12px" }}>
          <h1
            id="login-desktop-heading"
            className="text-white"
            style={{
              fontFamily: "'SF Pro Text', sans-serif",
              fontWeight: 600,
              fontSize: "28px",
              lineHeight: "40px",
            }}
          >
            Вход
          </h1>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: "18px",
              lineHeight: "26px",
              color: "#7F7F7F",
            }}
          >
            Войдите в свою учетную запись
          </p>
        </div>

        <form
          aria-labelledby="login-desktop-heading"
          aria-busy={loading}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!loading) void handleLogin();
          }}
          className="flex flex-col items-center pb-8"
          style={{ gap: "16px" }}
        >
          <div className="flex flex-col w-full" style={{ gap: "24px" }}>
            <div className="flex flex-col w-full" style={{ gap: "16px" }}>
              <div className="flex flex-col" style={{ gap: "8px" }}>
                <label
                  htmlFor="login-desktop-phone"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    fontSize: "16px",
                    lineHeight: "24px",
                    color: "#FFFFFF",
                  }}
                >
                  Номер телефона
                </label>
                <input
                  id="login-desktop-phone"
                  name="phone"
                  autoComplete="username"
                  inputMode="tel"
                  aria-invalid={Boolean(phoneError)}
                  aria-describedby={phoneError ? "login-desktop-phone-error" : undefined}
                  type="tel"
                  placeholder="+7 XXX XXX XX XX"
                  value={phone}
                  onChange={handlePhoneChange}
                  maxLength={19}
                  className="w-full placeholder:text-[#A0A0A5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E25B21]"
                  style={{
                    height: "48px",
                    padding: "12px 16px",
                    border: "1px solid #212121",
                    borderRadius: "8px",
                    background: "transparent",
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 400,
                    fontSize: "16px",
                    lineHeight: "22px",
                    color: "#FFFFFF",
                  }}
                />
                {phoneError && (
                  <p id="login-desktop-phone-error" role="alert" style={{ color: "#F87171", fontSize: "12px", fontFamily: "'Inter', sans-serif" }}>
                    {phoneError}
                  </p>
                )}
              </div>

              <div className="flex flex-col" style={{ gap: "8px" }}>
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="login-desktop-password"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      fontSize: "16px",
                      lineHeight: "24px",
                      color: "#FFFFFF",
                    }}
                  >
                    Пароль
                  </label>
                  <Link href="/reset-password">
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 500,
                        fontSize: "12px",
                        lineHeight: "24px",
                        color: "rgba(243, 87, 19, 0.91)",
                      }}
                    >
                      Забыли пароль?
                    </span>
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="login-desktop-password"
                    name="password"
                    autoComplete="current-password"
                    aria-invalid={Boolean(passwordError)}
                    aria-describedby={passwordError ? "login-desktop-password-error" : undefined}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    className="w-full placeholder:text-[#A0A0A5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E25B21]"
                    style={{
                      height: "48px",
                      padding: "12px 48px 12px 16px",
                      border: "1px solid #212121",
                      borderRadius: "8px",
                      background: "transparent",
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "24px",
                      color: "#FFFFFF",
                      letterSpacing: showPassword ? "normal" : "0.2em",
                    }}
                  />
                  <button
                    type="button"
                    onClick={toggleShowPassword}
                    className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E25B21]"
                    aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="w-6 h-6" style={{ color: "#A0A0A5" }} aria-hidden />
                    ) : (
                      <Eye className="w-6 h-6" style={{ color: "#A0A0A5" }} aria-hidden />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p id="login-desktop-password-error" role="alert" style={{ color: "#F87171", fontSize: "12px", fontFamily: "'Inter', sans-serif" }}>
                    {passwordError}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col w-full" style={{ gap: "16px" }}>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
                style={{
                  minHeight: "48px",
                  padding: "16px 12px",
                  background: "hsl(var(--action-background))",
                  borderRadius: "8px",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    fontSize: "16px",
                    lineHeight: "16px",
                    color: "#FFFFFF",
                    textAlign: "center",
                  }}
                >
                  {loading ? "Вход..." : "Войти"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleRegister}
                className="w-full flex justify-center items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{
                  minHeight: "48px",
                  padding: "12px 24px",
                  gap: "16px",
                  background: "#212121",
                  borderRadius: "8px",
                }}
              >
                <UserPlus className="w-6 h-6 shrink-0" style={{ color: "#A0A0A5" }} aria-hidden />
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 400,
                    fontSize: "16px",
                    lineHeight: "24px",
                    color: "#A0A0A5",
                    textAlign: "center",
                  }}
                >
                  Запросить регистрацию
                </span>
              </button>

              <button
                type="button"
                onClick={handleGuestLogin}
                className="w-full flex justify-center items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{
                  minHeight: "48px",
                  padding: "12px 24px",
                  gap: "16px",
                  background: "transparent",
                  border: "1px solid #3A3A3C",
                  borderRadius: "8px",
                }}
              >
                <User className="w-6 h-6 shrink-0" style={{ color: "#A0A0A5" }} aria-hidden />
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 400,
                    fontSize: "16px",
                    lineHeight: "24px",
                    color: "#A0A0A5",
                    textAlign: "center",
                  }}
                >
                  Войти как гость
                </span>
              </button>

              <Link
                href="/privacy"
                className="w-full flex justify-center items-center py-2 rounded-sm text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E25B21]"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                  fontSize: "16px",
                  lineHeight: "24px",
                  color: "#A0A0A5",
                  textDecoration: "none",
                }}
              >
                Политика конфиденциальности
              </Link>
            </div>
          </div>

          {formError && (
            <div
              className="w-full p-4"
              style={{
                background: "#1a1a1a",
                border: "1px solid #212121",
                borderRadius: "8px",
              }}
            >
              <p
                role="alert"
                className="text-center"
                style={{
                  color: "#F87171",
                  fontSize: "14px",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {formError}
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
