"use client";

import { useRouter } from "next/navigation";
import { useChangePassword } from "@/hooks/use-change-password";
import { ChangePasswordFormDesktop } from "@/components/auth/change-password-form-desktop";
import { ChangePasswordFormMobile } from "@/components/auth/change-password-form-mobile";

export function ChangePasswordForm() {
  const router = useRouter();
  const changePassword = useChangePassword({
    onSuccess: () => {
      setTimeout(() => router.back(), 800);
    },
  });

  return (
    <>
      <div className="hidden md:block">
        <ChangePasswordFormDesktop {...changePassword} />
      </div>
      <div className="md:hidden">
        <ChangePasswordFormMobile {...changePassword} />
      </div>
    </>
  );
}
