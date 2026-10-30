"use client";

import { Check } from "lucide-react";

type RegisterSuccessProps = {
  variant: "desktop" | "mobile";
  /** Запрос отправлен без SMS-подтверждения: его подтверждает Администратор. */
  withoutSms: boolean;
  onLogin: () => void;
};

/** Финальный экран регистрации: запрос отправлен, дальше — вход после одобрения. */
export function RegisterSuccess({ variant, withoutSms, onLogin }: RegisterSuccessProps) {
  const desktop = variant === "desktop";
  const message = withoutSms
    ? "Номер не подтверждён по SMS — администратор проверит данные и подтвердит регистрацию вручную."
    : "Администратор проверит данные и откроет доступ.";

  return (
    <div
      className={
        desktop
          ? "flex min-h-screen flex-col items-center justify-center bg-[#040404] px-5 py-16"
          : "flex min-h-screen flex-col justify-center bg-background px-5 py-8 safe-area-top safe-area-bottom"
      }
    >
      <div
        role="status"
        className={`flex w-full flex-col items-center text-center ${desktop ? "max-w-[420px]" : ""}`}
      >
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#F35713]/15 text-[#F35713] animate-in zoom-in duration-300">
          <Check className="h-8 w-8 stroke-[2.5]" aria-hidden />
        </div>
        <h1
          className={`text-[28px] font-semibold leading-10 ${desktop ? "text-white" : "text-foreground"}`}
        >
          Запрос отправлен
        </h1>
        <p
          className={`mt-3 text-base leading-6 ${desktop ? "text-[#7F7F7F]" : "text-muted-foreground"}`}
        >
          {message}
        </p>
        <p
          className={`mt-2 text-base leading-6 ${desktop ? "text-[#7F7F7F]" : "text-muted-foreground"}`}
        >
          После одобрения войдите по номеру телефона и паролю.
        </p>
        <button
          type="button"
          onClick={onLogin}
          className={`mt-8 flex min-h-12 w-full items-center justify-center rounded-lg px-4 py-3 text-base font-medium text-white ${
            desktop ? "bg-[#F35713] hover:bg-[#E04D0F]" : "bg-[hsl(var(--action-background))]"
          }`}
        >
          Перейти ко входу
        </button>
      </div>
    </div>
  );
}
