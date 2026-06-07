/**
 * Mobile theme tokens — parity with workflow-mobile/constants/theme.ts
 */

export type AppColorScheme = "light" | "dark";

export type MobileThemeColorName =
  | "background"
  | "surface"
  | "surfaceElevated"
  | "surfaceMuted"
  | "cardBackground"
  | "text"
  | "textPrimary"
  | "textSecondary"
  | "textMuted"
  | "border"
  | "primary"
  | "accent"
  | "onPrimary";

export const MOBILE_COLORS: Record<
  AppColorScheme,
  Record<MobileThemeColorName, string>
> = {
  light: {
    background: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceElevated: "#F8F9FB",
    surfaceMuted: "#F2F2F7",
    cardBackground: "#F2F2F7",
    text: "#11181C",
    textPrimary: "#11181C",
    textSecondary: "#3C3C43",
    textMuted: "#6E6E6E",
    border: "#E5E5EA",
    primary: "#E25B21",
    accent: "#E25B21",
    onPrimary: "#FFFFFF",
  },
  dark: {
    background: "#040404",
    surface: "#1A1A1A",
    surfaceElevated: "#242424",
    surfaceMuted: "#0F0F0F",
    cardBackground: "#1a1a1a",
    text: "#ECEDEE",
    textPrimary: "#ECEDEE",
    textSecondary: "#A0A0A5",
    textMuted: "#6E6E6E",
    border: "#212121",
    primary: "#E25B21",
    accent: "#E25B21",
    onPrimary: "#FFFFFF",
  },
};

/** Full-screen booking tab gradient — same in light and dark (RN parity). */
export const MOBILE_BOOKING_GRADIENT =
  "linear-gradient(180deg, #F35713 0%, #281504 100%)";

/** Bottom of booking gradient — underlay below absolute BottomNav. */
export const BOOKING_TAB_SCENE_UNDERLAY = "#281504";

export const COLOR_SCHEME_STORAGE_KEY = "workflow-color-scheme";
