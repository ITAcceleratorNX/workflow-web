"use client";

import { MOBILE_COLORS } from "@/constants/mobile-theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const ALL_REQUEST_TYPES = [
  { value: "normal", label: "Обычная" },
  { value: "urgent", label: "Экстренная" },
  { value: "planned", label: "Плановая" },
  { value: "recurring", label: "Повторяющаяся задача" },
] as const;

type RequestTypeChipsProps = {
  userRole: "client" | "admin-worker" | "department-head" | "executor" | "manager";
  value: string;
  onChange: (value: string) => void;
  themeOverride?: "light" | "dark";
};

function filterTypesForRole(
  role: RequestTypeChipsProps["userRole"],
): { value: string; label: string }[] {
  return ALL_REQUEST_TYPES.filter((t) => {
    if (role === "client" || role === "executor") {
      return t.value !== "planned" && t.value !== "recurring";
    }
    if (role === "department-head") {
      return t.value !== "recurring";
    }
    return true;
  });
}

/** Чипы типа заявки — parity с workflow-mobile REQUEST_TYPES filter. */
export function RequestTypeChips({ userRole, value, onChange, themeOverride }: RequestTypeChipsProps) {
  const scheme = useColorScheme();
  const { actionBackground: primary, text, border, onAction: onPrimary } = MOBILE_COLORS[themeOverride ?? scheme];

  const options = filterTypesForRole(userRole);

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((t) => {
        const selected = value === t.value;
        return (
          <button
            key={t.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(t.value)}
            className="px-3.5 py-2.5 rounded-[10px] border text-[13px] font-medium min-h-11 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            style={{
              borderColor: selected ? primary : border,
              backgroundColor: selected ? primary : "transparent",
              color: selected ? onPrimary : text,
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
