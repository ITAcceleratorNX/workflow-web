"use client";

import { SuccessModal } from "@/components/success-model";
import { RegisterFormDesktop } from "@/components/auth/register-form-desktop";
import { RegisterFormMobile } from "@/components/auth/register-form-mobile";
import { useRegister } from "@/hooks/use-register";

export function RegisterForm() {
  const register = useRegister();

  return (
    <>
      <div className="hidden md:block">
        <RegisterFormDesktop {...register} />
      </div>
      <div className="md:hidden">
        <RegisterFormMobile {...register} />
      </div>
      <SuccessModal
        isOpen={register.successModal.isOpen}
        onClose={register.handleSuccessClose}
        title="Успешно"
        message="Запрос на регистрацию отправлен. Ожидайте одобрения администратора."
      />
    </>
  );
}
