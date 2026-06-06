import { create } from "zustand";

interface TeamsInvalidateState {
  version: number;
  bump: () => void;
}

export const useTeamsInvalidateStore = create<TeamsInvalidateState>((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
}));
