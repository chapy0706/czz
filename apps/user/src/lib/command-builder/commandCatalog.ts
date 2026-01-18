// apps/user/src/lib/command-builder/commandCatalog.ts
export type CommandType =
  | "FILTER_EQUALS"
  | "FILTER_NOT_EQUALS"
  | "FILTER_GT"
  | "MAP_ADD"
  | "MAP_MULTIPLY"
  | "SORT_ASC"
  | "SORT_DESC"
  | "OUTPUT_FIRST"
  | "OUTPUT_LAST"
  | "OUTPUT_SUM";

export type ParamKind = "number" | "string";

export type UiMode = "default" | "beginner";

export type CommandParamSpec = {
  key: string; // DSL の JSON key（まずは value を想定）
  label: string;
  kind: ParamKind;
  required: boolean;
  defaultValue: number | string;

  // beginner UI 用（追加しても既存コードは壊れない）
  beginnerLabel?: string;
  beginnerPlaceholder?: string;
  beginnerHelp?: string;
};

export type UnixStep = {
  label: string;
  cmd: string;
};

export type CommandCatalogItem = {
  type: CommandType;
  label: string;
  unixHint: string;
  unixSteps?: UnixStep[];
  params?: CommandParamSpec[];

  // beginner UI 用（追加しても既存コードは壊れない）
  beginnerLabel?: string;
  beginnerDescription?: string;
  beginnerSearchKeywords?: string[];
};

export const RUNNER_INPUT_STEP: UnixStep = {
  label: "input",
  cmd: "cat input.csv",
};
export const RUNNER_OUTPUT_STEP: UnixStep = {
  label: "output",
  cmd: "> output.csv",
};

export const RUNNER_PREPROCESS_STEPS: UnixStep[] = [
  { label: "skip header", cmd: "tail -n +2" },
  { label: "col1", cmd: "cut -d, -f1" },
];

function buildItem(args: {
  type: CommandType;
  label: string;
  coreCmd: string;
  params?: CommandParamSpec[];
  beginnerLabel?: string;
  beginnerDescription?: string;
  beginnerSearchKeywords?: string[];
}): CommandCatalogItem {
  return {
    type: args.type,
    label: args.label,
    unixHint: args.coreCmd,
    unixSteps: [{ label: "command", cmd: args.coreCmd }],
    params: args.params,
    beginnerLabel: args.beginnerLabel,
    beginnerDescription: args.beginnerDescription,
    beginnerSearchKeywords: args.beginnerSearchKeywords,
  };
}

const VALUE_PARAM: CommandParamSpec = {
  key: "value",
  label: "value",
  kind: "number",
  required: true,
  defaultValue: 0,
  beginnerLabel: "数字",
  beginnerPlaceholder: "例: 3",
  beginnerHelp: "ここに数字を入れるよ",
};

export const COMMAND_CATALOG: CommandCatalogItem[] = [
  buildItem({
    type: "FILTER_EQUALS",
    label: "FILTER_EQUALS",
    coreCmd: "awk -v v=VALUE '$1==v'",
    params: [
      { ...VALUE_PARAM, defaultValue: 0, beginnerLabel: "そろえる数字" },
    ],
    beginnerLabel: "「同じ数字だけ残す」",
    beginnerDescription: "指定した数字と同じ行だけ残すよ",
    beginnerSearchKeywords: ["同じ", "一致", "残す", "フィルター"],
  }),
  buildItem({
    type: "FILTER_NOT_EQUALS",
    label: "FILTER_NOT_EQUALS",
    coreCmd: "awk -v v=VALUE '$1!=v'",
    params: [{ ...VALUE_PARAM, defaultValue: 0, beginnerLabel: "のぞく数字" }],
    beginnerLabel: "「ちがう数字だけ残す」",
    beginnerDescription: "指定した数字“以外”を残すよ",
    beginnerSearchKeywords: ["除外", "以外", "残す", "フィルター"],
  }),
  buildItem({
    type: "FILTER_GT",
    label: "FILTER_GT",
    coreCmd: "awk -v v=VALUE '$1>v'",
    params: [{ ...VALUE_PARAM, defaultValue: 0, beginnerLabel: "基準の数字" }],
    beginnerLabel: "「大きい数字だけ残す」",
    beginnerDescription: "基準より大きい数字だけ残すよ",
    beginnerSearchKeywords: ["より大きい", "大きい", "残す", "フィルター"],
  }),

  buildItem({
    type: "MAP_ADD",
    label: "MAP_ADD",
    coreCmd: "awk -v v=VALUE '{print $1+v}'",
    params: [{ ...VALUE_PARAM, defaultValue: 0, beginnerLabel: "足す数字" }],
    beginnerLabel: "「数字を足す」",
    beginnerDescription: "全部の数字に“足す数字”を足すよ",
    beginnerSearchKeywords: ["足す", "加算", "たす", "変換"],
  }),
  buildItem({
    type: "MAP_MULTIPLY",
    label: "MAP_MULTIPLY",
    coreCmd: "awk -v v=VALUE '{print $1*v}'",
    params: [{ ...VALUE_PARAM, defaultValue: 1, beginnerLabel: "かける数字" }],
    beginnerLabel: "「数字をかける」",
    beginnerDescription: "全部の数字に“かける数字”をかけるよ",
    beginnerSearchKeywords: ["かける", "乗算", "倍", "変換"],
  }),

  buildItem({
    type: "SORT_ASC",
    label: "SORT_ASC",
    coreCmd: "sort -n",
    beginnerLabel: "「小さい順に並べる」",
    beginnerDescription: "数字を小さい順にするよ",
    beginnerSearchKeywords: ["並べる", "ソート", "小さい順"],
  }),
  buildItem({
    type: "SORT_DESC",
    label: "SORT_DESC",
    coreCmd: "sort -nr",
    beginnerLabel: "「大きい順に並べる」",
    beginnerDescription: "数字を大きい順にするよ",
    beginnerSearchKeywords: ["並べる", "ソート", "大きい順"],
  }),

  buildItem({
    type: "OUTPUT_FIRST",
    label: "OUTPUT_FIRST",
    coreCmd: "head -n 1",
    beginnerLabel: "「最初の1つを出す」",
    beginnerDescription: "いちばん最初の結果を出すよ",
    beginnerSearchKeywords: ["最初", "先頭", "1つ"],
  }),
  buildItem({
    type: "OUTPUT_LAST",
    label: "OUTPUT_LAST",
    coreCmd: "tail -n 1",
    beginnerLabel: "「最後の1つを出す」",
    beginnerDescription: "いちばん最後の結果を出すよ",
    beginnerSearchKeywords: ["最後", "末尾", "1つ"],
  }),
  buildItem({
    type: "OUTPUT_SUM",
    label: "OUTPUT_SUM",
    coreCmd: "awk '{s+=$1} END{print s}'",
    beginnerLabel: "「合計を出す」",
    beginnerDescription: "全部を足した合計を出すよ",
    beginnerSearchKeywords: ["合計", "足し算", "サム"],
  }),
];

export function getCatalogItem(
  type: CommandType,
): CommandCatalogItem | undefined {
  return COMMAND_CATALOG.find((x) => x.type === type);
}

export function createDefaultCommandValue(type: CommandType): unknown {
  const item = getCatalogItem(type);
  const base: Record<string, unknown> = { type };
  const params = item?.params ?? [];
  for (const p of params) base[p.key] = p.defaultValue;
  return base;
}

export function getCommandDisplayLabel(
  type: CommandType,
  mode: UiMode,
): string {
  const item = getCatalogItem(type);
  if (!item) return type;
  if (mode === "beginner") return item.beginnerLabel ?? item.label ?? type;
  return type;
}

export function getCommandDisplaySubLabel(
  type: CommandType,
  mode: UiMode,
): string {
  const item = getCatalogItem(type);
  if (!item) return "";
  if (mode === "beginner") return item.beginnerDescription ?? item.unixHint;
  return item.unixHint;
}
