"use client";

import { RegisterFormDesktop } from "@/components/auth/register-form-desktop";
import { RegisterFormMobile } from "@/components/auth/register-form-mobile";
import { RegisterSuccess } from "@/components/auth/register-success";
import { useRegister } from "@/hooks/use-register";

export function RegisterForm() {
  const register = useRegister();

  if (register.submitted) {
    return (
      <>
        <div className="hidden md:block">
          <RegisterSuccess
            variant="desktop"
            withoutSms={register.submitted.withoutSms}
            onLogin={register.handleGoToLogin}
          />
        </div>
        <div className="md:hidden">
          <RegisterSuccess
            variant="mobile"
            withoutSms={register.submitted.withoutSms}
            onLogin={register.handleGoToLogin}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <RegisterFormDesktop {...register} />
      </div>
      <div className="md:hidden">
        <RegisterFormMobile {...register} />
      </div>
    </>
  );
}
