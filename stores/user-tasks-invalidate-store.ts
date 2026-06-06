import { create } from "zustand";

interface UserTasksInvalidateState {
  version: number;
  bump: () => void;
}

export const useUserTasksInvalidateStore = create<UserTasksInvalidateState>((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
}));
