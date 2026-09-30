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
  autoComplete?: React.InputHTMLAttributes<HTMLInputElement>["autoComplete"];
  name?: string;
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
  autoComplete,
  name,
  className,
}: AuthTextFieldProps) {
  const isPassword = type === "password";
  const [showPassword, setShowPassword] = useState(false);
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && !hideLabel ? (
        <label htmlFor={id} className="text-base font-medium leading-6 text-foreground">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          id={id}
          name={name ?? id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          inputMode={inputMode}
          autoComplete={autoComplete ?? (type === "tel" ? "tel" : undefined)}
          aria-label={hideLabel ? label : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "h-12 w-full rounded-lg border border-input bg-background px-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            error && "border-red-700 dark:border-red-400",
            isPassword && "pr-12",
            isPassword && !showPassword && "tracking-widest"
          )}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            aria-pressed={showPassword}
          >
            {showPassword ? (
              <EyeOff className="h-6 w-6" aria-hidden />
            ) : (
              <Eye className="h-6 w-6" aria-hidden />
            )}
          </button>
        ) : null}
      </div>
      {error ? <p id={`${id}-error`} role="alert" className="text-xs text-red-700 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
