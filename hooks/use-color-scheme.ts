"use client";

import type { AppColorScheme } from "@/constants/mobile-theme";
import { useColorSchemeStore } from "@/stores/color-scheme-store";

export type { AppColorScheme };

export function useColorScheme(): AppColorScheme {
  return useColorSchemeStore((s) => s.colorScheme);
}

export function setAppColorScheme(next: AppColorScheme): void {
  useColorSchemeStore.getState().setColorScheme(next);
}
