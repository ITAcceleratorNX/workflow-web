"use client";

import { useResetPassword } from "@/hooks/use-reset-password";
import { ResetPasswordFormDesktop } from "@/components/auth/reset-password-form-desktop";
import { ResetPasswordFormMobile } from "@/components/auth/reset-password-form-mobile";

export function ResetPasswordForm() {
  const reset = useResetPassword();

  return (
    <>
      <div className="hidden md:block">
        <ResetPasswordFormDesktop {...reset} />
      </div>
      <div className="md:hidden">
        <ResetPasswordFormMobile {...reset} />
      </div>
    </>
  );
}
