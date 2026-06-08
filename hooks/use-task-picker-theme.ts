"use client";

import { MOBILE_COLORS } from "@/constants/mobile-theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
export type TaskPickerVariant = "sheet" | "dialog";

export type TaskPickerTheme = {
  background: string;
  cardBg: string;
  text: string;
  textMuted: string;
  primary: string;
  border: string;
};

export function useTaskPickerTheme(variant: TaskPickerVariant = "sheet"): TaskPickerTheme {
  const colorScheme = useColorScheme();
  const theme = MOBILE_COLORS[variant === "dialog" ? "dark" : colorScheme];
  return {
    background: theme.background,
    cardBg: theme.cardBackground,
    text: theme.text,
    textMuted: theme.textMuted,
    primary: theme.primary,
    border: theme.border,
  };
}
