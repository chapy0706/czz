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
   * 例: "header skip", "col1", "filter", "redirect"
   */
  label: string;
  /**
   * シェル上で叩ける “1ステップ”
   * 例: "tail -n +2 input.csv"
   */
  cmd: string;
};

export type CommandCatalogItem = {
  type: CommandType;
  label: string;

  /**
   * UI に表示する “実行可能” な例（テンプレ）。
   * COL=1 固定、ヘッダあり前提。VALUE は UI が補間する想定。
   */
  unixHint: string;

  /**
   * 分解表示用（学習者に「パイプの部品」を見せる）
   * unixHint とズレないように、同一ソースから作る。
   */
  unixSteps?: UnixStep[];

  params?: CommandParamSpec[]; // Basic フォームで扱う params（なければ params なし）
};

// COL=1 固定、ヘッダあり前提の “前処理” を分解して定義
const PREPROCESS_STEPS: UnixStep[] = [
  { label: "skip header", cmd: "tail -n +2 input.csv" },
  { label: "col1", cmd: "cut -d, -f1" },
];

const REDIRECT_STEP: UnixStep = { label: "redirect", cmd: "> output.csv" };

function buildUnixHintFromSteps(steps: UnixStep[]): string {
  // ">" は pipe に混ぜず最後に付ける（見た目が教材っぽくなる）
  const redirectIdx = steps.findIndex((s) => s.cmd.trim().startsWith(">"));
  const main = (redirectIdx >= 0 ? steps.slice(0, redirectIdx) : steps).map((s) => s.cmd).join(" | ");
  const redirect = redirectIdx >= 0 ? ` ${steps[redirectIdx]?.cmd}` : "";
  return `${main}${redirect}`;
}

function stepsWithRedirect(coreCmd: string): UnixStep[] {
  return [...PREPROCESS_STEPS, { label: "command", cmd: coreCmd }, REDIRECT_STEP];
}

export const COMMAND_CATALOG: CommandCatalogItem[] = [
  {
    type: "FILTER_EQUALS",
    label: "FILTER_EQUALS",
    unixSteps: stepsWithRedirect("awk -v v=VALUE '$1==v'"),
    unixHint: buildUnixHintFromSteps(stepsWithRedirect("awk -v v=VALUE '$1==v'")),
    params: [{ key: "value", label: "value", kind: "number", required: true, defaultValue: 0 }],
  },
  {
    type: "FILTER_NOT_EQUALS",
    label: "FILTER_NOT_EQUALS",
    unixSteps: stepsWithRedirect("awk -v v=VALUE '$1!=v'"),
    unixHint: buildUnixHintFromSteps(stepsWithRedirect("awk -v v=VALUE '$1!=v'")),
    params: [{ key: "value", label: "value", kind: "number", required: true, defaultValue: 0 }],
  },
  {
    type: "FILTER_GT",
    label: "FILTER_GT",
    unixSteps: stepsWithRedirect("awk -v v=VALUE '$1>v'"),
    unixHint: buildUnixHintFromSteps(stepsWithRedirect("awk -v v=VALUE '$1>v'")),
    params: [{ key: "value", label: "value", kind: "number", required: true, defaultValue: 0 }],
  },

  {
    type: "MAP_ADD",
    label: "MAP_ADD",
    unixSteps: stepsWithRedirect("awk -v v=VALUE '{print $1+v}'"),
    unixHint: buildUnixHintFromSteps(stepsWithRedirect("awk -v v=VALUE '{print $1+v}'")),
    params: [{ key: "value", label: "value", kind: "number", required: true, defaultValue: 0 }],
  },
  {
    type: "MAP_MULTIPLY",
    label: "MAP_MULTIPLY",
    unixSteps: stepsWithRedirect("awk -v v=VALUE '{print $1*v}'"),
    unixHint: buildUnixHintFromSteps(stepsWithRedirect("awk -v v=VALUE '{print $1*v}'")),
    params: [{ key: "value", label: "value", kind: "number", required: true, defaultValue: 1 }],
  },

  {
    type: "SORT_ASC",
    label: "SORT_ASC",
    unixSteps: stepsWithRedirect("sort -n"),
    unixHint: buildUnixHintFromSteps(stepsWithRedirect("sort -n")),
  },
  {
    type: "SORT_DESC",
    label: "SORT_DESC",
    unixSteps: stepsWithRedirect("sort -nr"),
    unixHint: buildUnixHintFromSteps(stepsWithRedirect("sort -nr")),
  },

  {
    type: "OUTPUT_FIRST",
    label: "OUTPUT_FIRST",
    unixSteps: stepsWithRedirect("head -n 1"),
    unixHint: buildUnixHintFromSteps(stepsWithRedirect("head -n 1")),
  },
  {
    type: "OUTPUT_LAST",
    label: "OUTPUT_LAST",
    unixSteps: stepsWithRedirect("tail -n 1"),
    unixHint: buildUnixHintFromSteps(stepsWithRedirect("tail -n 1")),
  },
  {
    type: "OUTPUT_SUM",
    label: "OUTPUT_SUM",
    unixSteps: stepsWithRedirect("awk '{s+=$1} END{print s}'"),
    unixHint: buildUnixHintFromSteps(stepsWithRedirect("awk '{s+=$1} END{print s}'")),
  },
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
