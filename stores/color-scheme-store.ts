import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  COLOR_SCHEME_STORAGE_KEY,
  type AppColorScheme,
} from "@/constants/mobile-theme";

interface ColorSchemeState {
  colorScheme: AppColorScheme;
  setColorScheme: (scheme: AppColorScheme) => void;
}

export const useColorSchemeStore = create<ColorSchemeState>()(
  persist(
    (set) => ({
      colorScheme: "dark",
      setColorScheme: (scheme) => set({ colorScheme: scheme }),
    }),
    { name: COLOR_SCHEME_STORAGE_KEY }
  )
);
