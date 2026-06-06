/**
 * Semantic design tokens — aligned with workflow-mobile/constants/theme.ts.
 * CSS variables in app/globals.css are generated from these values.
 */

export const themeColors = {
  light: {
    background: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceElevated: "#F8F9FB",
    surfaceMuted: "#F2F2F7",
    text: "#11181C",
    textSecondary: "#3C3C43",
    textMuted: "#6E6E6E",
    border: "#E5E5EA",
    primary: "#E25B21",
    onPrimary: "#FFFFFF",
    accentSoft: "rgba(226, 91, 33, 0.12)",
    success: "#22c55e",
    warning: "#CA8A04",
    danger: "#DC2626",
    error: "#F35713",
    info: "#0284C7",
  },
  dark: {
    background: "#040404",
    surface: "#1A1A1A",
    surfaceElevated: "#242424",
    surfaceMuted: "#0F0F0F",
    text: "#ECEDEE",
    textSecondary: "#A0A0A5",
    textMuted: "#6E6E6E",
    border: "#212121",
    primary: "#E25B21",
    onPrimary: "#FFFFFF",
    accentSoft: "rgba(226, 91, 33, 0.18)",
    success: "#22c55e",
    warning: "#FACC15",
    danger: "#F87171",
    error: "#F35713",
    info: "#38BDF8",
  },
  /** Desktop shell — текущий web desktop (без redesign). */
  desktop: {
    bg: "#1A1A1A",
    primary: "#E85D2B",
    accent: "#2A9D8F",
    surfaceCard: "#2C2C2E",
    surfaceMuted: "#1C1C1E",
    border: "#3A3A3C",
    borderSubtle: "#212121",
    textMuted: "#8E8E93",
  },
} as const;

/** 4pt spacing scale (workflow-mobile Spacing). */
export const themeSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  huge: 32,
  giant: 48,
} as const;

/** Border radius scale (workflow-mobile Radius). */
export const themeRadius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/** HSL components for shadcn `hsl(var(--token))`. */
export const themeCssHsl = {
  light: {
    brandPrimary: "19 77% 51%",
    brandError: "18 90% 51%",
    foreground: "204 24% 9%",
    surface: "0 0% 100%",
    surfaceElevated: "210 20% 98%",
    surfaceMuted: "240 9% 96%",
    textMuted: "0 0% 43%",
    textSecondary: "240 3% 25%",
    border: "240 6% 90%",
  },
  dark: {
    brandPrimary: "19 77% 51%",
    brandError: "18 90% 51%",
    foreground: "210 11% 93%",
    surface: "0 0% 10%",
    surfaceElevated: "0 0% 14%",
    surfaceMuted: "0 0% 6%",
    textMuted: "0 0% 43%",
    textSecondary: "240 2% 63%",
    border: "0 0% 13%",
    background: "0 0% 1.5%",
  },
  desktop: {
    bg: "0 0% 10%",
    primary: "14 80% 56%",
    accent: "168 58% 39%",
    surfaceCard: "240 2% 17%",
    surfaceMuted: "240 2% 12%",
    border: "240 2% 23%",
  },
} as const;
