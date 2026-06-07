import { create } from "zustand";

/**
 * UI-состояние вкладки «Бронь»: шаг формы бронирования не отражён в nested navigation,
 * поэтому сигнал для скрытия bottom nav хранится здесь (parity с workflow-mobile).
 */
interface BookingTabUiState {
  hideBottomNavForBookingForm: boolean;
  setHideBottomNavForBookingForm: (hide: boolean) => void;
}

export const useBookingTabUiStore = create<BookingTabUiState>((set) => ({
  hideBottomNavForBookingForm: false,
  setHideBottomNavForBookingForm: (hide) => set({ hideBottomNavForBookingForm: hide }),
}));
