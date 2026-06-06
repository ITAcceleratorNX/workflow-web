"use client";

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
          className={cn(
            "font-medium text-white",
            isMobile
              ? "text-base leading-6"
              : "text-base leading-6"
          )}
          style={isMobile ? undefined : { fontFamily: "'Inter', sans-serif" }}
        >
          {label}
        </label>
      ) : null}
      <InputOTP
        maxLength={6}
        value={value}
        onChange={onChange}
        containerClassName={cn("gap-2", !isMobile && "justify-center")}
      >
        <InputOTPGroup>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <InputOTPSlot
              key={index}
              index={index}
              className={cn(
                "h-12 w-12 text-lg font-semibold text-white transition-all duration-200",
                "border border-[#212121] bg-transparent rounded-lg"
              )}
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}
