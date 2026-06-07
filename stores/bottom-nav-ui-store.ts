import { create } from "zustand";

/** Принудительное скрытие bottom nav (модалки manager home и т.п.). */
interface BottomNavUiState {
  forceHidden: boolean;
  setForceHidden: (hidden: boolean) => void;
}

export const useBottomNavUiStore = create<BottomNavUiState>((set) => ({
  forceHidden: false,
  setForceHidden: (hidden) => set({ forceHidden: hidden }),
}));
