// apps/user/src/lib/command-builder/commandBuilderStore.ts
import {
  createDefaultCommandValue,
  type CommandType,
} from "@/lib/command-builder/commandCatalog";
import { create } from "zustand";

export type CommandDraft = {
  id: string;
  value: unknown;
};

function uid() {
  return Math.random().toString(36).slice(2);
}

/**
 * サーバー側のZodで `value: number` を期待しているコマンドがあるのに、
 * UI入力の都合で `"3"` のような string が混ざることがある。
 * ここで「数値として解釈できる文字列」だけを number に寄せて送る。
 *
 * - 例: "003" / "-2" / "10" / "3.14" は number に変換
 * - 例: "" / "abc" / "1,2" は変換しない
 */
function coerceNumericString(v: unknown): unknown {
  if (typeof v !== "string") return v;

  const s = v.trim();
  if (!s) return v;

  // 純粋に数値っぽい文字列だけ変換する（文字混じりはNG）
  if (!/^[+-]?\d+(\.\d+)?$/.test(s)) return v;

  const n = Number(s);
  if (!Number.isFinite(n)) return v;

  return n;
}

const NUMERIC_KEYS = new Set([
  "value",
  "n",
  "amount",
  "count",
  "limit",
  "index",
  "start",
  "end",
  "from",
  "to",
  "threshold",
]);

function normalizeCommandPayload(raw: unknown): unknown {
  if (Array.isArray(raw)) {
    const next = raw.map(normalizeCommandPayload);
    const changed = next.some((v, i) => v !== raw[i]);
    return changed ? next : raw;
  }

  if (!raw || typeof raw !== "object") return raw;

  const obj = raw as Record<string, unknown>;
  let changed = false;
  const out: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(obj)) {
    let nv: unknown = v;

    if (NUMERIC_KEYS.has(k)) {
      nv = coerceNumericString(v);
    } else if (v && typeof v === "object") {
      nv = normalizeCommandPayload(v);
    }

    if (nv !== v) changed = true;
    out[k] = nv;
  }

  return changed ? out : raw;
}

type State = {
  commands: CommandDraft[];
  selectedId: string | null;
  editingId: string | null;

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

  initForTask: (_taskId) => {},

  select: (id) => set({ selectedId: id }),

  openEditor: (id) => set({ editingId: id }),
  closeEditor: () => set({ editingId: null }),

  add: (type) => {
    const next: CommandDraft = {
      id: uid(),
      value: createDefaultCommandValue(type),
    };
    set((s) => ({
      commands: [...s.commands, next],
      selectedId: next.id,
      editingId: null,
    }));
  },

  remove: (id) => {
    set((s) => {
      const removedIndex = s.commands.findIndex((c) => c.id === id);
      if (removedIndex < 0) return s;

      const nextCommands = s.commands.filter((c) => c.id !== id);
      const nextEditingId = s.editingId === id ? null : s.editingId;

      let nextSelectedId = s.selectedId;

      if (s.selectedId === id) {
        if (nextCommands.length === 0) {
          nextSelectedId = null;
        } else {
          const nextIndex = Math.min(removedIndex, nextCommands.length - 1);
          nextSelectedId = nextCommands[nextIndex].id;
        }
      } else if (nextSelectedId != null) {
        const stillExists = nextCommands.some((c) => c.id === nextSelectedId);
        if (!stillExists) {
          nextSelectedId =
            nextCommands.length > 0
              ? nextCommands[Math.min(removedIndex, nextCommands.length - 1)].id
              : null;
        }
      }

      return {
        commands: nextCommands,
        selectedId: nextSelectedId,
        editingId: nextEditingId,
      };
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
      commands: s.commands.map((c) =>
        c.id === id ? { ...c, value: next } : c,
      ),
    }));
  },

  serializeProgram: () => {
    const cmds = get().commands.map((c) => normalizeCommandPayload(c.value));
    return { commands: cmds };
  },
}));
