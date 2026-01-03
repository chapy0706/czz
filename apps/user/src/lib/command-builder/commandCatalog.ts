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

export type CommandParamSpec = {
  key: string; // DSL の JSON key（まずは value を想定）
  label: string;
  kind: ParamKind;
  required: boolean;
  defaultValue: number | string;
};

export type UnixStep = {
  /**
   * UI での説明用（短く）
   * 例: "header skip", "col1", "filter"
   */
  label: string;
  /**
   * シェル上で叩ける “1ステップ”
   * 例: "tail -n +2"
   */
  cmd: string;
};

export type CommandCatalogItem = {
  type: CommandType;
  label: string;

  /**
   * UI に表示する “変換部分だけ” の例（テンプレ）。
   * Runner 側で入出力（cat input.csv / > output.csv）を固定表示するため、
   * このテンプレにはファイル I/O を含めない。
   */
  unixHint: string;

  /**
   * “短い表示” 用（可能なら 1 コマンドに圧縮）。
   * 例: "sort -n" / "awk -v v=VALUE '$1>v'"
   */
  unixShort?: string;

  /**
   * 分解表示用（学習者に「パイプの部品」を見せる）
   * unixHint とズレないように、同一ソースから作る。
   */
  unixSteps?: UnixStep[];

  params?: CommandParamSpec[]; // Basic フォームで扱う params（なければ params なし）
};

/**
 * Runner 専用の “開始/終了” ステップ（DSL 的には意味が薄いが、視覚的に両端を固定できる）
 */
export const RUNNER_INPUT_STEP: UnixStep = { label: "input", cmd: "cat input.csv" };
export const RUNNER_OUTPUT_STEP: UnixStep = { label: "output", cmd: "> output.csv" };

// COL=1 固定、ヘッダあり前提の “前処理” を分解して定義
// ここもファイル名は含めない（入力は Runner が担当）
const PREPROCESS_STEPS: UnixStep[] = [
  { label: "skip header", cmd: "tail -n +2" },
  { label: "col1", cmd: "cut -d, -f1" },
];

function buildUnixHintFromSteps(steps: UnixStep[]): string {
  return steps.map((s) => s.cmd).join(" | ");
}

function stepsWithPreprocess(coreCmd: string): UnixStep[] {
  return [...PREPROCESS_STEPS, { label: "command", cmd: coreCmd }];
}

function buildItem(args: {
  type: CommandType;
  label: string;
  coreCmd: string;
  params?: CommandParamSpec[];
}): CommandCatalogItem {
  const unixSteps = stepsWithPreprocess(args.coreCmd);
  const unixHint = buildUnixHintFromSteps(unixSteps);

  return {
    type: args.type,
    label: args.label,
    unixSteps,
    unixHint,
    unixShort: args.coreCmd,
    params: args.params,
  };
}

export const COMMAND_CATALOG: CommandCatalogItem[] = [
  buildItem({
    type: "FILTER_EQUALS",
    label: "FILTER_EQUALS",
    coreCmd: "awk -v v=VALUE '$1==v'",
    params: [{ key: "value", label: "value", kind: "number", required: true, defaultValue: 0 }],
  }),
  buildItem({
    type: "FILTER_NOT_EQUALS",
    label: "FILTER_NOT_EQUALS",
    coreCmd: "awk -v v=VALUE '$1!=v'",
    params: [{ key: "value", label: "value", kind: "number", required: true, defaultValue: 0 }],
  }),
  buildItem({
    type: "FILTER_GT",
    label: "FILTER_GT",
    coreCmd: "awk -v v=VALUE '$1>v'",
    params: [{ key: "value", label: "value", kind: "number", required: true, defaultValue: 0 }],
  }),

  buildItem({
    type: "MAP_ADD",
    label: "MAP_ADD",
    coreCmd: "awk -v v=VALUE '{print $1+v}'",
    params: [{ key: "value", label: "value", kind: "number", required: true, defaultValue: 0 }],
  }),
  buildItem({
    type: "MAP_MULTIPLY",
    label: "MAP_MULTIPLY",
    coreCmd: "awk -v v=VALUE '{print $1*v}'",
    params: [{ key: "value", label: "value", kind: "number", required: true, defaultValue: 1 }],
  }),

  buildItem({
    type: "SORT_ASC",
    label: "SORT_ASC",
    coreCmd: "sort -n",
  }),
  buildItem({
    type: "SORT_DESC",
    label: "SORT_DESC",
    coreCmd: "sort -nr",
  }),

  buildItem({
    type: "OUTPUT_FIRST",
    label: "OUTPUT_FIRST",
    coreCmd: "head -n 1",
  }),
  buildItem({
    type: "OUTPUT_LAST",
    label: "OUTPUT_LAST",
    coreCmd: "tail -n 1",
  }),
  buildItem({
    type: "OUTPUT_SUM",
    label: "OUTPUT_SUM",
    coreCmd: "awk '{s+=$1} END{print s}'",
  }),
];

export function getCatalogItem(type: CommandType): CommandCatalogItem | undefined {
  return COMMAND_CATALOG.find((x) => x.type === type);
}

export function createDefaultCommandValue(type: CommandType): unknown {
  const item = getCatalogItem(type);
  const base: Record<string, unknown> = { type };
  const params = item?.params ?? [];
  for (const p of params) base[p.key] = p.defaultValue;
  return base;
}
