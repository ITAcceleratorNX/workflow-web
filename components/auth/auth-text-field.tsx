"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AuthTextFieldProps {
  id: string;
  label?: string;
  hideLabel?: boolean;
  type?: "text" | "tel" | "password" | "email";
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  className?: string;
}

export function AuthTextField({
  id,
  label,
  hideLabel,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  maxLength,
  inputMode,
  className,
}: AuthTextFieldProps) {
  const isPassword = type === "password";
  const [showPassword, setShowPassword] = useState(false);
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && !hideLabel ? (
        <label htmlFor={id} className="text-base font-medium leading-6 text-white">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          inputMode={inputMode}
          className={cn(
            "h-12 w-full rounded-lg border border-[#212121] bg-transparent px-4 text-base text-white outline-none",
            isPassword && "pr-12",
            isPassword && !showPassword && "tracking-widest"
          )}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2"
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
          >
            {showPassword ? (
              <EyeOff className="h-6 w-6 text-[#6E6E6E]" />
            ) : (
              <Eye className="h-6 w-6 text-[#6E6E6E]" />
            )}
          </button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-[#F35713]">{error}</p> : null}
    </div>
  );
}
