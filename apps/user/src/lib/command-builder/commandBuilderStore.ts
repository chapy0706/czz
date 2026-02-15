// apps/user/src/lib/command-builder/commandBuilderStore.ts

import { create } from "zustand";
import {
	type CommandType,
	createDefaultCommandValue,
	isCommandType,
} from "@/lib/command-builder/commandCatalog";
import {
	DEFAULT_RUNNER_IO,
	type RunnerInputPreset,
	type RunnerIoPreset,
	type RunnerOutputPreset,
} from "@/lib/terminal/runnerIo";

export type CommandDraft = {
	id: string;
	value: unknown;
};

function uid() {
	return Math.random().toString(36).slice(2);
}

type State = {
	commands: CommandDraft[];

	// 選択（ハイライト）と編集（シート）
	selectedId: string | null;
	editingId: string | null;

	// Runner I/O（cat input.csv / >> output.csv 等）
	runnerIo: RunnerIoPreset;

	initForTask: (taskId: string) => void;

	select: (id: string | null) => void;
	openEditor: (id: string) => void;
	closeEditor: () => void;

	add: (type: CommandType | string) => void;
	remove: (id: string) => void;
	move: (fromIndex: number, toIndex: number) => void;
	clear: () => void;
	clearCommands: () => void;

	updateCommandJson: (id: string, next: unknown) => void;

	setRunnerInput: (preset: RunnerInputPreset | null) => void;
	setRunnerOutput: (preset: RunnerOutputPreset | null) => void;
	resetRunnerIo: () => void;

	// evaluate API にはまだ渡さない（dslProgramSchema が {commands} 前提のため）
	serializeProgram: () => { commands: unknown[] };
};

export const useCommandBuilderStore = create<State>((set, get) => ({
	commands: [],
	selectedId: null,
	editingId: null,

	runnerIo: DEFAULT_RUNNER_IO,

	initForTask: (_taskId) => {
		set({
			commands: [],
			selectedId: null,
			editingId: null,
		});
	},

	select: (id) => set({ selectedId: id }),

	openEditor: (id) => set({ editingId: id }),
	closeEditor: () => set({ editingId: null }),

	add: (type) => {
		// UI 側で string になっても落とさない（安全にガード）
		if (!isCommandType(type)) return;

		const next: CommandDraft = {
			id: uid(),
			value: createDefaultCommandValue(type),
		};

		// 追加したら “選択” は移すが、編集シートは開かない
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

			// 削除後の選択を “迷子” にしない:
			// - 削除対象が選択中なら、同じ位置（末尾ならひとつ前）を選ぶ
			// - 選択中でないなら、基本は維持（念のため存在チェック）
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

	clear: () =>
		set({
			commands: [],
			selectedId: null,
			editingId: null,
			runnerIo: DEFAULT_RUNNER_IO,
		}),
	clearCommands: () =>
		set((s) => ({
			commands: [],
			selectedId: null,
			editingId: null,
			runnerIo: s.runnerIo,
		})),

	updateCommandJson: (id, next) => {
		set((s) => ({
			commands: s.commands.map((c) =>
				c.id === id ? { ...c, value: next } : c,
			),
		}));
	},

	setRunnerInput: (preset) =>
		set((s) => ({
			runnerIo: { ...s.runnerIo, input: preset ?? "unset" },
		})),
	setRunnerOutput: (preset) =>
		set((s) => ({
			runnerIo: { ...s.runnerIo, output: preset ?? "unset" },
		})),
	resetRunnerIo: () => set({ runnerIo: DEFAULT_RUNNER_IO }),

	serializeProgram: () => {
		const cmds = get().commands.map((c) => c.value);
		return { commands: cmds };
	},
}));
