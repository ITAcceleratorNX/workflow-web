"use client";

import { useLogin } from "@/hooks/use-login";
import { LoginFormDesktop } from "@/components/auth/login-form-desktop";
import { LoginFormMobile } from "@/components/auth/login-form-mobile";

export function LoginForm() {
  const login = useLogin();

  return (
    <>
      <div className="hidden md:block">
        <LoginFormDesktop {...login} />
      </div>
      <div className="md:hidden">
        <LoginFormMobile {...login} />
      </div>
    </>
  );
}
