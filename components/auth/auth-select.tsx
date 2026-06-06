"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface AuthSelectOption {
  value: string;
  label: string;
}

export interface AuthSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: AuthSelectOption[];
  placeholder: string;
}

/** Desktop custom select — pixel-parity с прежним register page. */
export function AuthSelect({ value, onChange, options, placeholder }: AuthSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between outline-none"
        style={{
          height: "48px",
          padding: "12px 16px",
          border: "1px solid #212121",
          borderRadius: "8px",
          background: "transparent",
          fontFamily: "'Inter', sans-serif",
          fontWeight: 400,
          fontSize: "16px",
          lineHeight: "22px",
          color: selectedOption ? "#FFFFFF" : "#6E6E6E",
        }}
      >
        <span>{selectedOption?.label || placeholder}</span>
        <ChevronDown className="h-5 w-5" style={{ color: "#6E6E6E" }} />
      </button>
      {isOpen ? (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-auto"
          style={{
            background: "#1a1a1a",
            border: "1px solid #212121",
            borderRadius: "8px",
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left transition-colors hover:bg-[#212121]"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "16px",
                color: "#FFFFFF",
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
