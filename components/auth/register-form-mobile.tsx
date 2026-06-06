"use client";

import Link from "next/link";
import {
  COMPANY_OTHER_VALUE,
  REGISTRATION_ROLES,
  REGISTER_STEP_SUBTITLES,
  REGISTER_STEP_TITLES,
} from "@/constants/registration";
import { AuthOtpInput } from "@/components/auth/otp-input";
import { AuthTextField } from "@/components/auth/auth-text-field";
import type { UseRegisterResult } from "@/hooks/use-register";

type RegisterFormMobileProps = UseRegisterResult;

function MobileSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-12 w-full appearance-none rounded-lg border border-[#212121] bg-transparent px-4 text-base text-white outline-none"
    >
      <option value="" disabled className="bg-[#1a1a1a] text-[#6E6E6E]">
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-[#1a1a1a] text-white">
          {option.label}
        </option>
      ))}
    </select>
  );
}

/** Mobile register — parity с workflow-mobile/app/register/index.tsx */
export function RegisterFormMobile(props: RegisterFormMobileProps) {
  const {
    formData,
    setFormData,
    offices,
    companies,
    categoryOptions,
    loading,
    step,
    setStep,
    formErrors,
    setFormErrors,
    verificationCode,
    setVerificationCode,
    isSendingCode,
    countdown,
    isStep1Valid,
    handlePhoneChange,
    handleMobileStep1Next,
    handleVerifyCode,
    handleResendCode,
    handleSubmit,
  } = props;

  return (
    <div className="min-h-screen flex flex-col bg-background safe-area-top safe-area-bottom">
      <div className="flex flex-1 flex-col justify-center px-5 py-8">
        <header className="mb-8 flex flex-col gap-3">
          <h1 className="text-[28px] font-semibold leading-10 text-white">
            {REGISTER_STEP_TITLES[step - 1]}
          </h1>
          <p className="text-lg leading-[26px] text-[#7F7F7F]">
            {REGISTER_STEP_SUBTITLES[step - 1]}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {step === 1 && (
            <>
              <AuthTextField
                id="phone"
                label="Номер телефона"
                type="tel"
                placeholder="+7 700 123 45 67"
                value={formData.phone}
                onChange={handlePhoneChange}
                maxLength={19}
                inputMode="tel"
              />
              <AuthTextField
                id="full_name"
                label="ФИО"
                placeholder="Ахметов Айдос Ерланұлы"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, full_name: e.target.value }))
                }
              />
              <div className="flex flex-col gap-2">
                <span className="text-base font-medium leading-6 text-white">Офис</span>
                <MobileSelect
                  value={formData.office_id}
                  onChange={(v) =>
                    setFormData((p) => ({
                      ...p,
                      office_id: v,
                      service_category_id: "",
                      company_id: "",
                      company_other_name: "",
                    }))
                  }
                  options={offices.map((o) => ({ value: String(o.id), label: o.name }))}
                  placeholder="Выберите офис из списка"
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-base font-medium leading-6 text-white">Роль</span>
                <MobileSelect
                  value={formData.role}
                  onChange={(v) =>
                    setFormData((p) => ({
                      ...p,
                      role: v,
                      service_category_id: "",
                      company_id: v === "client" ? p.company_id : "",
                      company_other_name: v === "client" ? p.company_other_name : "",
                    }))
                  }
                  options={[...REGISTRATION_ROLES]}
                  placeholder="Клиент или исполнитель"
                />
              </div>
              {formData.role === "client" && formData.office_id !== "" && (
                <div className="flex flex-col gap-2">
                  <span className="text-base font-medium leading-6 text-white">Компания</span>
                  <MobileSelect
                    value={formData.company_id}
                    onChange={(v) =>
                      setFormData((p) => ({
                        ...p,
                        company_id: v,
                        company_other_name:
                          v === COMPANY_OTHER_VALUE ? p.company_other_name : "",
                      }))
                    }
                    options={[
                      ...companies.map((c) => ({ value: String(c.id), label: c.name })),
                      { value: COMPANY_OTHER_VALUE, label: "Другое" },
                    ]}
                    placeholder="Выберите компанию"
                  />
                </div>
              )}
              {formData.role === "client" &&
                formData.company_id === COMPANY_OTHER_VALUE && (
                  <AuthTextField
                    id="company_other_name"
                    label="Название компании"
                    placeholder="Введите название вашей компании"
                    value={formData.company_other_name}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, company_other_name: e.target.value }))
                    }
                  />
                )}
              {formData.role === "executor" && (
                <div className="flex flex-col gap-2">
                  <span className="text-base font-medium leading-6 text-white">
                    Категория услуг
                  </span>
                  <MobileSelect
                    value={formData.service_category_id}
                    onChange={(v) =>
                      setFormData((p) => ({ ...p, service_category_id: v }))
                    }
                    options={categoryOptions}
                    placeholder="Категория услуг"
                  />
                </div>
              )}
              {formErrors ? (
                <p className="text-xs text-[#F35713]">{formErrors}</p>
              ) : null}
              <button
                type="button"
                onClick={() => void handleMobileStep1Next()}
                disabled={!isStep1Valid || isSendingCode}
                className="flex h-12 w-full items-center justify-center rounded-lg bg-[#F35713] text-base font-medium text-white disabled:opacity-50"
              >
                Далее
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-center text-sm text-[#7F7F7F]">
                Мы отправили SMS с кодом на номер {formData.phone}
              </p>
              <AuthOtpInput
                variant="mobile"
                label="Введите код"
                value={verificationCode}
                onChange={(v) => {
                  setVerificationCode(v);
                  setFormErrors(null);
                }}
              />
              {formErrors ? (
                <p className="text-center text-xs text-[#F35713]">{formErrors}</p>
              ) : null}
              <button
                type="button"
                onClick={() => void handleVerifyCode()}
                disabled={verificationCode.length !== 6}
                className="flex h-12 w-full items-center justify-center rounded-lg bg-[#F35713] text-base font-medium text-white disabled:opacity-50"
              >
                Подтвердить
              </button>
              <button
                type="button"
                onClick={() => void handleResendCode()}
                disabled={isSendingCode || countdown > 0}
                className="flex h-12 w-full items-center justify-center rounded-lg bg-[#212121] text-base text-[#6E6E6E] disabled:opacity-50"
              >
                {isSendingCode
                  ? "Отправка..."
                  : countdown > 0
                    ? `Отправить повторно (${countdown}с)`
                    : "Отправить код повторно"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setFormErrors(null);
                  setVerificationCode("");
                }}
                className="flex h-12 w-full items-center justify-center text-base text-[#6E6E6E]"
              >
                Назад
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <AuthTextField
                id="password"
                label="Пароль"
                type="password"
                placeholder="Не менее 6 символов"
                value={formData.password}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, password: e.target.value }))
                }
              />
              <AuthTextField
                id="confirm_password"
                label="Подтвердите пароль"
                type="password"
                placeholder="Введите пароль ещё раз"
                value={formData.confirm_password}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, confirm_password: e.target.value }))
                }
              />
              {formErrors ? (
                <p className="text-xs text-[#F35713]">{formErrors}</p>
              ) : null}
              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-lg bg-[#F35713] text-base font-medium text-white disabled:opacity-50"
              >
                {loading ? "Отправка..." : "Отправить запрос"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(2);
                  setFormErrors(null);
                }}
                className="flex h-12 w-full items-center justify-center text-base text-[#6E6E6E]"
              >
                Назад
              </button>
            </>
          )}

          <Link
            href="/login"
            className="flex h-12 w-full items-center justify-center rounded-lg bg-[rgba(56,189,248,0.18)] text-base text-[#38BDF8]"
          >
            Вернуться к входу
          </Link>
        </form>
      </div>
    </div>
  );
}
