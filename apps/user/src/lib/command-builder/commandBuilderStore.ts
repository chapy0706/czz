// apps/user/src/lib/command-builder/commandBuilderStore.ts
import { create } from "zustand";
import type { CommandType } from "./commandCatalog";
import { createDefaultCommandValue } from "./commandCatalog";

export type CommandDraft = {
  id: string;
  // DSLコマンドは unknown（API境界）で扱う。UIは最低限 type を読むだけ。
  value: unknown;
};

type CommandBuilderState = {
  taskId: string | null;
  commands: CommandDraft[];
  selectedId: string | null;

  initForTask: (taskId: string) => void;
  select: (id: string | null) => void;

  add: (type: CommandType) => void;
  remove: (id: string) => void;
  move: (fromIndex: number, toIndex: number) => void;

  updateCommandJson: (id: string, next: unknown) => void;

  clear: () => void;
  serializeProgram: () => { commands: unknown[] };

  // 永続
  loadFromStorage: () => void;
  saveToStorage: () => void;
};

function uid() {
  return Math.random().toString(36).slice(2);
}

function storageKey(taskId: string) {
  return `czz:command-builder:${taskId}`;
}

export const useCommandBuilderStore = create<CommandBuilderState>((set, get) => ({
  taskId: null,
  commands: [],
  selectedId: null,

  initForTask: (taskId) => {
    set({ taskId, commands: [], selectedId: null });
    // まず load
    setTimeout(() => {
      get().loadFromStorage();
    }, 0);
  },

  select: (id) => set({ selectedId: id }),

  add: (type) => {
    const item: CommandDraft = { id: uid(), value: createDefaultCommandValue(type) };
    set((s) => ({ commands: [...s.commands, item], selectedId: item.id }));
    get().saveToStorage();
  },

  remove: (id) => {
    set((s) => {
      const next = s.commands.filter((c) => c.id !== id);
      const selectedId = s.selectedId === id ? null : s.selectedId;
      return { commands: next, selectedId };
    });
    get().saveToStorage();
  },

  move: (fromIndex, toIndex) => {
    set((s) => {
      const next = [...s.commands];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return { commands: next };
    });
    get().saveToStorage();
  },

  updateCommandJson: (id, nextJson) => {
    set((s) => ({
      commands: s.commands.map((c) => (c.id === id ? { ...c, value: nextJson } : c)),
    }));
    get().saveToStorage();
  },

  clear: () => {
    set({ commands: [], selectedId: null });
    get().saveToStorage();
  },

  serializeProgram: () => {
    const { commands } = get();
    return { commands: commands.map((c) => c.value) };
  },

  loadFromStorage: () => {
    const { taskId } = get();
    if (!taskId) return;
    try {
      const raw = localStorage.getItem(storageKey(taskId));
      if (!raw) return;
      const parsed = JSON.parse(raw) as { commands?: unknown[] };
      if (!Array.isArray(parsed.commands)) return;

      const drafts: CommandDraft[] = parsed.commands.map((value) => ({ id: uid(), value }));
      set({ commands: drafts, selectedId: drafts.length > 0 ? drafts[drafts.length - 1]!.id : null });
    } catch {
      // ignore
    }
  },

  saveToStorage: () => {
    const { taskId } = get();
    if (!taskId) return;
    try {
      const program = get().serializeProgram();
      localStorage.setItem(storageKey(taskId), JSON.stringify(program));
    } catch {
      // ignore
    }
  },
}));
