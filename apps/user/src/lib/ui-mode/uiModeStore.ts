// apps/user/src/lib/ui-mode/uiModeStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UiMode = "advanced" | "beginner";

type UiModeState = {
  mode: UiMode;
  setMode: (mode: UiMode) => void;
  toggle: () => void;
};

export const useUiModeStore = create<UiModeState>()(
  persist(
    (set, get) => ({
      mode: "advanced",
      setMode: (mode) => set({ mode }),
      toggle: () =>
        set({ mode: get().mode === "beginner" ? "advanced" : "beginner" }),
    }),
    {
      name: "czz-ui-mode",
      version: 1,
    },
  ),
);
