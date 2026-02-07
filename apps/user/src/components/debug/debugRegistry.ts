// apps/user/src/components/debug/debugRegistry.ts
export type DebugLastEval = {
	lastRequestId?: string;
	lastResultId?: string;
	lastStatus?: string;
	lastError?: string;
	updatedAt?: number; // epoch ms
};

type Snapshot = {
	rendered: string[];
	lastEval: DebugLastEval;
};

type Listener = () => void;

const state: {
	rendered: Set<string>;
	lastEval: DebugLastEval;
	listeners: Set<Listener>;
	version: number;
	cachedSnapshot: Snapshot;
} = {
	rendered: new Set<string>(),
	lastEval: {},
	listeners: new Set<Listener>(),
	version: 0,
	cachedSnapshot: { rendered: [], lastEval: {} },
};

function rebuildSnapshot() {
	// 変更があった時だけ新しい参照を作る
	state.cachedSnapshot = {
		rendered: Array.from(state.rendered).sort(),
		lastEval: { ...state.lastEval },
	};
}

function notify() {
	for (const l of state.listeners) l();
}

export const debugRegistry = {
	markRendered(name: string) {
		const before = state.rendered.size;
		state.rendered.add(name);
		if (state.rendered.size === before) return; // 変化なし

		state.version += 1;
		rebuildSnapshot();
		notify();
	},

	unmarkRendered(name: string) {
		const removed = state.rendered.delete(name);
		if (!removed) return; // 変化なし

		state.version += 1;
		rebuildSnapshot();
		notify();
	},

	setLastEval(patch: DebugLastEval) {
		state.lastEval = {
			...state.lastEval,
			...patch,
			updatedAt: Date.now(),
		};

		state.version += 1;
		rebuildSnapshot();
		notify();
	},

	clear() {
		if (state.rendered.size === 0 && Object.keys(state.lastEval).length === 0)
			return;

		state.rendered.clear();
		state.lastEval = {};

		state.version += 1;
		rebuildSnapshot();
		notify();
	},

	getSnapshot(): Snapshot {
		// ✅ 同じ状態なら同じ参照を返す（重要）
		return state.cachedSnapshot;
	},

	subscribe(listener: Listener) {
		state.listeners.add(listener);
		return () => state.listeners.delete(listener);
	},
};
