// apps/user/src/lib/command-builder/commandCatalog.ts
// （既存の commandCatalog.updated.ts ベース。初心者ラベルだけ「数字を足す/かける」に調整）
import { z } from "zod";

export type CommandType =
	| "FILTER_EQUALS"
	| "FILTER_GT"
	| "FILTER_LT"
	| "FILTER_BETWEEN"
	| "MAP_ADD"
	| "MAP_MULTIPLY"
	| "SORT_ASC"
	| "SORT_DESC"
	| "OUTPUT_FIRST"
	| "OUTPUT_LAST"
	| "OUTPUT_SUM"
	| "OUTPUT_COUNT"
	| "OUTPUT_COLUMN_SUM";

export type ParamSpec = {
	key: string;
	label: string;
	required?: boolean;
	schema: z.ZodTypeAny;

	// beginner UI
	beginnerLabel?: string;
	beginnerPlaceholder?: string;
	beginnerHelp?: string;

	ui?: {
		hideInEditor?: boolean;
		fixedValueInEditor?: unknown;
	};
};

export type CommandCatalogItem = {
	type: CommandType;
	label: string;
	unixHint: string;
	params?: ParamSpec[];
	ui: {
		beginnerLabel: string;
		beginnerExample: string;
	};
};

type RunnerStep = {
	type: string;
	label: string;
	unixHint: string;
	params: ParamSpec[];
	ui: {
		beginnerLabel: string;
		beginnerExample: string;
	};
};

export const COMMAND_CATALOG: CommandCatalogItem[] = [
	{
		type: "FILTER_EQUALS",
		label: "Filter: equals",
		unixHint: "grep VALUE",
		params: [
			{
				key: "column",
				label: "column",
				required: true,
				schema: z.string().min(1),
				beginnerLabel: "どの列？",
				beginnerPlaceholder: "例: score",
				beginnerHelp: "絞りこみに使う列名を入れてね",
			},
			{
				key: "value",
				label: "value",
				required: true,
				schema: z.string().min(1),
				beginnerLabel: "どの値？",
				beginnerPlaceholder: "例: 10",
				beginnerHelp: "この値と同じ行だけ残すよ",
			},
		],
		ui: {
			beginnerLabel: "同じものだけのこす",
			beginnerExample: "「COLUMN」が「VALUE」と同じ行だけ残す",
		},
	},
	{
		type: "FILTER_GT",
		label: "Filter: greater than",
		unixHint: "awk '$col > VALUE'",
		params: [
			{
				key: "column",
				label: "column",
				required: true,
				schema: z.string().min(1),
				beginnerLabel: "どの列？",
				beginnerPlaceholder: "例: score",
			},
			{
				key: "value",
				label: "value",
				required: true,
				schema: z.coerce.number(),
				beginnerLabel: "いくつより大きい？",
				beginnerPlaceholder: "例: 50",
			},
		],
		ui: {
			beginnerLabel: "大きいものだけのこす",
			beginnerExample: "「COLUMN」が「VALUE」より大きい行だけ残す",
		},
	},
	{
		type: "FILTER_LT",
		label: "Filter: less than",
		unixHint: "awk '$col < VALUE'",
		params: [
			{
				key: "column",
				label: "column",
				required: true,
				schema: z.string().min(1),
				beginnerLabel: "どの列？",
				beginnerPlaceholder: "例: score",
			},
			{
				key: "value",
				label: "value",
				required: true,
				schema: z.coerce.number(),
				beginnerLabel: "いくつより小さい？",
				beginnerPlaceholder: "例: 10",
			},
		],
		ui: {
			beginnerLabel: "小さいものだけのこす",
			beginnerExample: "「COLUMN」が「VALUE」より小さい行だけ残す",
		},
	},
	{
		type: "FILTER_BETWEEN",
		label: "Filter: between",
		unixHint: "awk 'VALUE1 <= $col && $col <= VALUE2'",
		params: [
			{
				key: "column",
				label: "column",
				required: true,
				schema: z.string().min(1),
				beginnerLabel: "どの列？",
				beginnerPlaceholder: "例: score",
			},
			{
				key: "min",
				label: "min",
				required: true,
				schema: z.coerce.number(),
				beginnerLabel: "いくつから？",
				beginnerPlaceholder: "例: 10",
			},
			{
				key: "max",
				label: "max",
				required: true,
				schema: z.coerce.number(),
				beginnerLabel: "いくつまで？",
				beginnerPlaceholder: "例: 50",
			},
		],
		ui: {
			beginnerLabel: "範囲でしぼる",
			beginnerExample: "「COLUMN」が「MIN〜MAX」の行だけ残す",
		},
	},

	{
		type: "MAP_ADD",
		label: "Map: add",
		unixHint: "awk '{print $1+VALUE}'",
		params: [
			{
				key: "value",
				label: "value",
				required: true,
				schema: z.coerce.number(),
				beginnerLabel: "いくつ足す？",
				beginnerPlaceholder: "例: 3",
				beginnerHelp: "各行の数に足すよ",
			},
		],
		ui: {
			beginnerLabel: "数字を足す",
			beginnerExample: "各行の数に「VALUE」を足す",
		},
	},
	{
		type: "MAP_MULTIPLY",
		label: "Map: multiply",
		unixHint: "awk '{print $1*VALUE}'",
		params: [
			{
				key: "value",
				label: "value",
				required: true,
				schema: z.coerce.number(),
				beginnerLabel: "いくつかける？",
				beginnerPlaceholder: "例: 2",
				beginnerHelp: "各行の数にかけるよ",
			},
		],
		ui: {
			beginnerLabel: "数字をかける",
			beginnerExample: "各行の数に「VALUE」をかける",
		},
	},

	{
		type: "SORT_ASC",
		label: "Sort: asc",
		unixHint: "sort -n",
		ui: {
			beginnerLabel: "小さい順に並べる",
			beginnerExample: "数が小さい順に並び替える",
		},
	},
	{
		type: "SORT_DESC",
		label: "Sort: desc",
		unixHint: "sort -nr",
		ui: {
			beginnerLabel: "大きい順に並べる",
			beginnerExample: "数が大きい順に並び替える",
		},
	},

	{
		type: "OUTPUT_FIRST",
		label: "Output: first",
		unixHint: "head -n 1",
		ui: {
			beginnerLabel: "一番上だけ出す",
			beginnerExample: "一番最初の行だけ出力する",
		},
	},
	{
		type: "OUTPUT_LAST",
		label: "Output: last",
		unixHint: "tail -n 1",
		ui: {
			beginnerLabel: "一番下だけ出す",
			beginnerExample: "一番最後の行だけ出力する",
		},
	},
	{
		type: "OUTPUT_SUM",
		label: "Output: sum",
		unixHint: "awk '{s+=$1} END{print s}'",
		ui: {
			beginnerLabel: "合計を出す",
			beginnerExample: "全部の数を足して合計を出す",
		},
	},
	{
		type: "OUTPUT_COUNT",
		label: "Output: count",
		unixHint: "wc -l",
		ui: {
			beginnerLabel: "数をかぞえる",
			beginnerExample: "行の数を数える",
		},
	},
	{
		type: "OUTPUT_COLUMN_SUM",
		label: "Output: column sum",
		unixHint: "awk '{s+=$col} END{print s}'",
		params: [
			{
				key: "column",
				label: "column",
				required: true,
				schema: z.string().min(1),
				beginnerLabel: "どの列を足す？",
				beginnerPlaceholder: "例: score",
			},
		],
		ui: {
			beginnerLabel: "列の合計を出す",
			beginnerExample: "「COLUMN」の合計を出す",
		},
	},
];
// Runner 表示用の “疑似ステップ”。
// PipelinePanel が import しているが、実コマンド一覧（COMMAND_CATALOG）には入れない。
// 形が多少違っても壊れないように、型は最小限で逃がす。

export const RUNNER_INPUT_STEP: RunnerStep = {
	type: "__RUNNER_INPUT__",
	label: "input.csv",
	unixHint: "input.csv",
	params: [],
	ui: {
		beginnerLabel: "入力データ",
		beginnerExample: "input.csv を読み込むよ",
	},
};

export const RUNNER_OUTPUT_STEP: RunnerStep = {
	type: "__RUNNER_OUTPUT__",
	label: "output.csv",
	unixHint: "output.csv",
	params: [],
	ui: {
		beginnerLabel: "出力データ",
		beginnerExample: "output.csv を作るよ",
	},
};

// 前処理ステップ（現状は空でOK）
// ここに “入力の整形” 的な疑似ステップを後で足せる。
export const RUNNER_PREPROCESS_STEPS: RunnerStep[] = [];

export function getCatalogItem(
	type: CommandType,
): CommandCatalogItem | undefined {
	return COMMAND_CATALOG.find((x) => x.type === type);
}

export function isCommandType(value: unknown): value is CommandType {
	return (
		typeof value === "string" && COMMAND_CATALOG.some((x) => x.type === value)
	);
}

export function createDefaultCommandValue(type: CommandType): unknown {
	const item = getCatalogItem(type);
	const value: Record<string, unknown> = { type };

	// item が無い場合でも最低限 { type } を返す
	if (!item) return value;

	// params の defaultValue / default / initialValue など “ありがちな名前” を拾って初期化
	for (const p of item.params ?? []) {
		const anyP = p as ParamSpec & {
			defaultValue?: unknown;
			default?: unknown;
			initialValue?: unknown;
			kind?: string;
			type?: string;
			options?: unknown[];
		};

		const dv =
			anyP.defaultValue ?? anyP.default ?? anyP.initialValue ?? undefined;

		if (dv !== undefined) {
			value[p.key] = dv;
			continue;
		}

		// fallback（型情報が無い/薄い前提で安全側に）
		// 数値っぽいなら 0、それ以外は空文字
		const kind = String(anyP.kind ?? anyP.type ?? "");
		if (
			kind.includes("number") ||
			kind.includes("int") ||
			kind.includes("float")
		) {
			value[p.key] = 0;
		} else if (kind.includes("boolean") || kind.includes("bool")) {
			value[p.key] = false;
		} else if (Array.isArray(anyP.options) && anyP.options.length > 0) {
			value[p.key] = anyP.options[0];
		} else {
			value[p.key] = "";
		}
	}

	return value;
}
