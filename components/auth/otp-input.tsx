"use client";

import { useId } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

export interface AuthOtpInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  /** desktop — текущий web UI; mobile — RN parity */
  variant?: "desktop" | "mobile";
  className?: string;
}

/** Shared OTP input для register / reset-password (3.2+). */
export function AuthOtpInput({
  value,
  onChange,
  label,
  variant = "desktop",
  className,
}: AuthOtpInputProps) {
  const isMobile = variant === "mobile";
  const id = useId();

  return (
    <div
      className={cn(
        "flex flex-col",
        isMobile ? "items-stretch gap-2" : "items-center gap-4",
        className
      )}
    >
      {label ? (
        <label
          htmlFor={id}
          className={cn(
            "font-medium text-base leading-6",
            isMobile ? "text-foreground" : "text-white"
          )}
          style={isMobile ? undefined : { fontFamily: "'Inter', sans-serif" }}
        >
          {label}
        </label>
      ) : null}
      <InputOTP
        id={id}
        aria-label={label ?? "Код из SMS"}
        autoComplete="one-time-code"
        maxLength={6}
        value={value}
        onChange={onChange}
        containerClassName={cn("gap-2", !isMobile && "justify-center")}
      >
        <InputOTPGroup className={isMobile ? "w-full min-w-0" : undefined}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <InputOTPSlot
              key={index}
              index={index}
              className={cn(
                "h-12 text-lg font-semibold transition-all duration-200 border bg-transparent rounded-lg",
                isMobile ? "min-w-0 flex-1 border-input text-foreground" : "w-12 border-[#212121] text-white"
              )}
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}
