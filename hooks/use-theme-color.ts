"use client";

import {
  MOBILE_COLORS,
  type MobileThemeColorName,
} from "@/constants/mobile-theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function useThemeColor(colorName: MobileThemeColorName): string {
  const scheme = useColorScheme();
  return MOBILE_COLORS[scheme][colorName];
}
