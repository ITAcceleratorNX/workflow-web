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

/** Desktop login form — pixel-parity с прежним app/login/page.tsx (≥768px). */
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

        <div className="flex flex-col items-center" style={{ gap: "16px" }}>
          <div className="flex flex-col w-full" style={{ gap: "24px" }}>
            <div className="flex flex-col w-full" style={{ gap: "16px" }}>
              <div className="flex flex-col" style={{ gap: "8px" }}>
                <label
                  htmlFor="phone"
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
                  id="phone"
                  type="tel"
                  placeholder="+7 XXX XXX XX XX"
                  value={phone}
                  onChange={handlePhoneChange}
                  maxLength={19}
                  className="w-full outline-none"
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
                  <p style={{ color: "#F35713", fontSize: "12px", fontFamily: "'Inter', sans-serif" }}>
                    {phoneError}
                  </p>
                )}
              </div>

              <div className="flex flex-col" style={{ gap: "8px" }}>
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="password"
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
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    className="w-full outline-none pr-12"
                    style={{
                      height: "48px",
                      padding: "12px 16px",
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
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="w-6 h-6" style={{ color: "#6E6E6E" }} />
                    ) : (
                      <Eye className="w-6 h-6" style={{ color: "#6E6E6E" }} />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p style={{ color: "#F35713", fontSize: "12px", fontFamily: "'Inter', sans-serif" }}>
                    {passwordError}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col w-full" style={{ gap: "16px" }}>
              <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="w-full flex justify-center items-center disabled:opacity-50"
                style={{
                  height: "48px",
                  padding: "16px 12px",
                  background: "#F35713",
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
                className="w-full flex justify-center items-center"
                style={{
                  height: "48px",
                  padding: "12px 54px",
                  gap: "16px",
                  background: "#212121",
                  borderRadius: "8px",
                }}
              >
                <UserPlus className="w-6 h-6" style={{ color: "#6E6E6E" }} />
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 400,
                    fontSize: "16px",
                    lineHeight: "24px",
                    color: "#6E6E6E",
                    textAlign: "center",
                  }}
                >
                  Запросить регистрацию
                </span>
              </button>

              <button
                type="button"
                onClick={handleGuestLogin}
                className="w-full flex justify-center items-center"
                style={{
                  height: "48px",
                  padding: "12px 54px",
                  gap: "16px",
                  background: "transparent",
                  border: "1px solid #3A3A3C",
                  borderRadius: "8px",
                }}
              >
                <User className="w-6 h-6" style={{ color: "#7F7F7F" }} />
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 400,
                    fontSize: "16px",
                    lineHeight: "24px",
                    color: "#7F7F7F",
                    textAlign: "center",
                  }}
                >
                  Войти как гость
                </span>
              </button>

              <Link
                href="/privacy"
                className="w-full flex justify-center items-center py-2 text-center hover:opacity-80 transition-opacity"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                  fontSize: "16px",
                  lineHeight: "24px",
                  color: "#6E6E6E",
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
                className="text-center"
                style={{
                  color: "#F35713",
                  fontSize: "14px",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {formError}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
