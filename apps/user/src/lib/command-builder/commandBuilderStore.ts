// apps/user/src/lib/command-builder/commandBuilderStore.ts
import { createDefaultCommandValue, type CommandType } from "@/lib/command-builder/commandCatalog";
import { create } from "zustand";

export type CommandDraft = {
  id: string;
  value: unknown;
};

function uid() {
  return Math.random().toString(36).slice(2);
}

type State = {
  commands: CommandDraft[];
  selectedId: string | null; // 選択（ハイライト）
  editingId: string | null; // 編集中（シート）

  initForTask: (taskId: string) => void;

  select: (id: string | null) => void;
  openEditor: (id: string) => void;
  closeEditor: () => void;

  add: (type: CommandType) => void;
  remove: (id: string) => void;
  move: (fromIndex: number, toIndex: number) => void;
  clear: () => void;

  updateCommandJson: (id: string, next: unknown) => void;
  serializeProgram: () => { commands: unknown[] };
};

export const useCommandBuilderStore = create<State>((set, get) => ({
  commands: [],
  selectedId: null,
  editingId: null,

  initForTask: (_taskId) => {
    // 既存の初期化があるならここに寄せる。今回は noop でもOK。
  },

  select: (id) => set({ selectedId: id }),

  openEditor: (id) => set({ editingId: id }),
  closeEditor: () => set({ editingId: null }),

  add: (type) => {
    const next: CommandDraft = { id: uid(), value: createDefaultCommandValue(type) };

    // 追加したら “選択” は移すが、編集シートは開かない（ここが今回の肝）
    set((s) => ({
      commands: [...s.commands, next],
      selectedId: next.id,
      editingId: null,
    }));
  },

  remove: (id) => {
    set((s) => {
      const next = s.commands.filter((c) => c.id !== id);

      const selectedId = s.selectedId === id ? null : s.selectedId;
      const editingId = s.editingId === id ? null : s.editingId;

      return { commands: next, selectedId, editingId };
    });
  },

  move: (fromIndex, toIndex) => {
    set((s) => {
      const arr = [...s.commands];
      const [x] = arr.splice(fromIndex, 1);
      if (!x) return s;
      arr.splice(toIndex, 0, x);
      return { commands: arr };
    });
  },

  clear: () => set({ commands: [], selectedId: null, editingId: null }),

  updateCommandJson: (id, next) => {
    set((s) => ({
      commands: s.commands.map((c) => (c.id === id ? { ...c, value: next } : c)),
    }));
  },

  serializeProgram: () => {
    const cmds = get().commands.map((c) => c.value);
    return { commands: cmds };
  },
}));
