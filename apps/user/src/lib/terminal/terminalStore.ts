// apps/user/lib/terminal/terminalStore.ts
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type TerminalHistoryState = {
  history: string[];
  pushHistory: (cmd: string) => void;
};

const HISTORY_LIMIT = 20;

export const useTerminalHistoryStore = create<TerminalHistoryState>()(
  persist(
    (set, get) => ({
      history: [],
      pushHistory: (cmd) => {
        const trimmed = cmd.trim();
        if (!trimmed) return;

        const prev = get().history;
        const next = [trimmed, ...prev.filter((x) => x !== trimmed)].slice(0, HISTORY_LIMIT);
        set({ history: next });
      },
    }),
    {
      name: "czz-terminal-history",
      version: 1,
    }
  )
);
