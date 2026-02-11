// apps/user/src/lib/terminal/terminalStore.ts
"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { EvaluateResponse } from "@/lib/terminal/evaluateContract";

const storage = createJSONStorage(() => localStorage, {
	replacer: (_k, v) => (typeof v === "bigint" ? v.toString() : v),
});

type TerminalHistoryState = {
	history: string[];
	pushHistory: (cmd: string) => void;
	clearHistory: () => void;
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
				const next = [trimmed, ...prev.filter((x) => x !== trimmed)].slice(
					0,
					HISTORY_LIMIT,
				);
				set({ history: next });
			},
			clearHistory: () => set({ history: [] }),
		}),
		{
			name: "czz-terminal-history",
			version: 2,
			storage,
			partialize: (s) => ({ history: s.history }),
			migrate: (persisted) => {
				if (!persisted || typeof persisted !== "object") {
					return { history: [] };
				}
				const record = persisted as { history?: unknown };
				return {
					history: Array.isArray(record.history) ? record.history : [],
				};
			},
		},
	),
);

export type ResultMeta = {
	taskId?: string;
	pipelineText?: string;
};

export type CachedResult = {
	savedAt: number;
	meta?: ResultMeta;
	response: EvaluateResponse;
};

type ResultCacheState = {
	byId: Record<string, CachedResult>;
	latestId: string | null;

	save: (response: EvaluateResponse, meta?: ResultMeta) => string;
	remove: (resultId: string) => void;
	clearAll: () => void;
};

function newId(): string {
	const cryptoObj = typeof crypto !== "undefined" ? crypto : undefined;
	if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
		return cryptoObj.randomUUID();
	}
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export const useTerminalResultCacheStore = create<ResultCacheState>()(
	persist(
		(set) => ({
			byId: {},
			latestId: null,

			save: (response, meta) => {
				const id = newId();
				const next: CachedResult = { savedAt: Date.now(), response, meta };

				set((s) => ({
					byId: { ...s.byId, [id]: next },
					latestId: id,
				}));

				return id;
			},

			remove: (resultId) => {
				set((s) => {
					const { [resultId]: _removed, ...rest } = s.byId;
					const latestId = s.latestId === resultId ? null : s.latestId;
					return { byId: rest, latestId };
				});
			},

			clearAll: () => set({ byId: {}, latestId: null }),
		}),
		{
			name: "czz-terminal-result-cache",
			version: 1,
			storage,
			partialize: (s) => ({ byId: s.byId, latestId: s.latestId }),
			migrate: (persisted) => {
				if (!persisted || typeof persisted !== "object") {
					return { byId: {}, latestId: null };
				}
				const record = persisted as {
					byId?: unknown;
					latestId?: unknown;
				};
				const byId =
					record.byId && typeof record.byId === "object" ? record.byId : {};
				const latestId =
					typeof record.latestId === "string" ? record.latestId : null;
				return { byId, latestId };
			},
		},
	),
);

export function persistResult(
	response: EvaluateResponse,
	meta?: ResultMeta,
): string {
	return useTerminalResultCacheStore.getState().save(response, meta);
}
