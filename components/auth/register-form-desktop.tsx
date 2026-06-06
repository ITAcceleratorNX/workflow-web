"use client";

import Link from "next/link";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import {
  COMPANY_OTHER_VALUE,
  REGISTRATION_ROLES,
  REGISTER_STEP_SUBTITLES,
  REGISTER_STEP_TITLES,
} from "@/constants/registration";
import { AuthOtpInput } from "@/components/auth/otp-input";
import { AuthSelect } from "@/components/auth/auth-select";
import type { UseRegisterResult } from "@/hooks/use-register";

type RegisterFormDesktopProps = UseRegisterResult;

const fieldLabelStyle = {
  fontFamily: "'Inter', sans-serif",
  fontWeight: 500,
  fontSize: "16px",
  lineHeight: "24px",
  color: "#FFFFFF",
} as const;

const inputStyle = {
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
} as const;

/** Desktop register — pixel-parity с прежним app/register/page.tsx (≥768px). */
export function RegisterFormDesktop({
  formData,
  setFormData,
  offices,
  companies,
  categoryOptions,
  loading,
  step,
  setStep,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  formErrors,
  setFormErrors,
  verificationCode,
  setVerificationCode,
  isSendingCode,
  countdown,
  isStep1Valid,
  handlePhoneChange,
  handleDesktopStep1Next,
  handleVerifyCode,
  handleResendCode,
  handleSubmit,
}: RegisterFormDesktopProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center overflow-auto"
      style={{ background: "#040404" }}
    >
      <div
        className="flex flex-col px-5 py-8 md:py-16 w-full md:max-w-[420px]"
        style={{ gap: "32px" }}
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
            {REGISTER_STEP_TITLES[step - 1]}
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
            {REGISTER_STEP_SUBTITLES[step - 1]}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: "24px" }}>
          {step === 1 && (
            <>
              <div className="flex flex-col" style={{ gap: "8px" }}>
                <label htmlFor="phone" style={fieldLabelStyle}>
                  Номер телефона
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+7 XXX XXX XX XX"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  maxLength={19}
                  required
                  className="w-full outline-none"
                  style={inputStyle}
                />
              </div>

              <div className="flex flex-col" style={{ gap: "8px" }}>
                <label htmlFor="full_name" style={fieldLabelStyle}>
                  ФИО
                </label>
                <input
                  id="full_name"
                  type="text"
                  placeholder="Введите полное имя"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                  }
                  required
                  className="w-full outline-none"
                  style={inputStyle}
                />
              </div>

              <div className="flex flex-col" style={{ gap: "8px" }}>
                <label style={fieldLabelStyle}>Офис</label>
                <AuthSelect
                  value={formData.office_id}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      office_id: value,
                      service_category_id: "",
                      company_id: "",
                      company_other_name: "",
                    }))
                  }
                  options={offices.map((o) => ({
                    value: o.id.toString(),
                    label: o.name,
                  }))}
                  placeholder="Выберите офис"
                />
              </div>

              <div className="flex flex-col" style={{ gap: "8px" }}>
                <label style={fieldLabelStyle}>Роль</label>
                <AuthSelect
                  value={formData.role}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      role: value,
                      service_category_id: "",
                      company_id: "",
                      company_other_name: "",
                    }))
                  }
                  options={REGISTRATION_ROLES.map((r) => ({
                    value: r.value,
                    label: r.label,
                  }))}
                  placeholder="Выберите роль"
                />
              </div>

              {formData.role === "client" && formData.office_id && (
                <div className="flex flex-col" style={{ gap: "8px" }}>
                  <label style={fieldLabelStyle}>Компания</label>
                  <AuthSelect
                    value={formData.company_id}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        company_id: value,
                        company_other_name:
                          value === COMPANY_OTHER_VALUE ? prev.company_other_name : "",
                      }))
                    }
                    options={[
                      ...companies.map((c) => ({
                        value: c.id.toString(),
                        label: c.name,
                      })),
                      { value: COMPANY_OTHER_VALUE, label: "Другое" },
                    ]}
                    placeholder={
                      companies.length
                        ? "Выберите компанию"
                        : "Компании ещё не добавлены — выберите «Другое»"
                    }
                  />
                  {formData.company_id === COMPANY_OTHER_VALUE && (
                    <input
                      type="text"
                      placeholder="Название компании"
                      value={formData.company_other_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          company_other_name: e.target.value,
                        }))
                      }
                      maxLength={255}
                      className="w-full outline-none"
                      style={inputStyle}
                    />
                  )}
                </div>
              )}

              {formData.role === "executor" && (
                <div className="flex flex-col" style={{ gap: "8px" }}>
                  <label style={fieldLabelStyle}>Категория услуг</label>
                  <AuthSelect
                    value={formData.service_category_id}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, service_category_id: value }))
                    }
                    options={categoryOptions}
                    placeholder="Выберите категорию"
                  />
                </div>
              )}

              {formErrors && (
                <p style={{ color: "#F35713", fontSize: "12px", fontFamily: "'Inter', sans-serif" }}>
                  {formErrors}
                </p>
              )}

              <button
                type="button"
                onClick={handleDesktopStep1Next}
                disabled={!isStep1Valid}
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
                  Далее
                </span>
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <p
                className="text-center"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "14px",
                  color: "#7F7F7F",
                }}
              >
                Мы отправили SMS с кодом на номер {formData.phone}
              </p>

              <AuthOtpInput
                variant="desktop"
                label="Введите код"
                value={verificationCode}
                onChange={(value) => {
                  setVerificationCode(value);
                  setFormErrors(null);
                }}
              />

              {formErrors && (
                <p
                  className="text-center"
                  style={{ color: "#F35713", fontSize: "12px", fontFamily: "'Inter', sans-serif" }}
                >
                  {formErrors}
                </p>
              )}

              <div className="flex flex-col" style={{ gap: "16px" }}>
                <button
                  type="button"
                  onClick={() => void handleVerifyCode()}
                  disabled={verificationCode.length !== 6}
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
                    }}
                  >
                    Подтвердить
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleResendCode()}
                  disabled={isSendingCode || countdown > 0}
                  className="w-full flex justify-center items-center disabled:opacity-50"
                  style={{
                    height: "48px",
                    padding: "12px",
                    background: "#212121",
                    borderRadius: "8px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "24px",
                      color: "#6E6E6E",
                    }}
                  >
                    {isSendingCode
                      ? "Отправка..."
                      : countdown > 0
                        ? `Отправить повторно (${countdown}с)`
                        : "Отправить код повторно"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setFormErrors(null);
                    setVerificationCode("");
                  }}
                  className="w-full flex justify-center items-center"
                  style={{
                    height: "48px",
                    padding: "12px",
                    background: "transparent",
                    borderRadius: "8px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "24px",
                      color: "#6E6E6E",
                    }}
                  >
                    Назад
                  </span>
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex flex-col" style={{ gap: "8px" }}>
                <label htmlFor="password" style={fieldLabelStyle}>
                  Пароль
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Минимум 6 символов"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, password: e.target.value }))
                    }
                    required
                    minLength={6}
                    className="w-full outline-none pr-12"
                    style={{ ...inputStyle, lineHeight: "24px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="w-6 h-6" style={{ color: "#6E6E6E" }} />
                    ) : (
                      <Eye className="w-6 h-6" style={{ color: "#6E6E6E" }} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col" style={{ gap: "8px" }}>
                <label htmlFor="confirm_password" style={fieldLabelStyle}>
                  Подтвердите пароль
                </label>
                <div className="relative">
                  <input
                    id="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Повторите пароль"
                    value={formData.confirm_password}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        confirm_password: e.target.value,
                      }))
                    }
                    required
                    className="w-full outline-none pr-12"
                    style={{ ...inputStyle, lineHeight: "24px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-6 h-6" style={{ color: "#6E6E6E" }} />
                    ) : (
                      <Eye className="w-6 h-6" style={{ color: "#6E6E6E" }} />
                    )}
                  </button>
                </div>
              </div>

              {formErrors && (
                <p style={{ color: "#F35713", fontSize: "12px", fontFamily: "'Inter', sans-serif" }}>
                  {formErrors}
                </p>
              )}

              <div className="flex flex-col" style={{ gap: "16px" }}>
                <button
                  type="submit"
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
                    }}
                  >
                    {loading ? "Отправка..." : "Отправить запрос"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep(2);
                    setFormErrors(null);
                  }}
                  className="w-full flex justify-center items-center"
                  style={{
                    height: "48px",
                    padding: "12px",
                    background: "transparent",
                    borderRadius: "8px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "24px",
                      color: "#6E6E6E",
                    }}
                  >
                    Назад
                  </span>
                </button>
              </div>
            </>
          )}

          <Link href="/login" className="w-full">
            <button
              type="button"
              className="w-full flex justify-center items-center"
              style={{
                height: "48px",
                padding: "12px 54px",
                gap: "16px",
                background: "#212121",
                borderRadius: "8px",
              }}
            >
              <ArrowLeft className="w-6 h-6" style={{ color: "#6E6E6E" }} />
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                  fontSize: "16px",
                  lineHeight: "24px",
                  color: "#6E6E6E",
                }}
              >
                Вернуться к входу
              </span>
            </button>
          </Link>
        </form>
      </div>
    </div>
  );
}
