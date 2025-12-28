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

export type CommandCatalogItem = {
  type: CommandType;
  label: string;
  unixHint: string;
  params?: CommandParamSpec[]; // Basic フォームで扱う params（なければ params なし）
};

// 共通の列抽出（ヘッダ除外）: COL=1固定、ヘッダあり
const CSV_EXTRACT_COL1 = "tail -n +2 input.csv | cut -d, -f1";

export const COMMAND_CATALOG: CommandCatalogItem[] = [
  {
    type: "FILTER_EQUALS",
    label: "FILTER_EQUALS",
    unixHint: `${CSV_EXTRACT_COL1} | awk -v v=VALUE '$1==v' > output.csv`,
    params: [{ key: "value", label: "value", kind: "number", required: true, defaultValue: 0 }],
  },
  {
    type: "FILTER_NOT_EQUALS",
    label: "FILTER_NOT_EQUALS",
    unixHint: `${CSV_EXTRACT_COL1} | awk -v v=VALUE '$1!=v' > output.csv`,
    params: [{ key: "value", label: "value", kind: "number", required: true, defaultValue: 0 }],
  },
  {
    type: "FILTER_GT",
    label: "FILTER_GT",
    unixHint: `${CSV_EXTRACT_COL1} | awk -v v=VALUE '$1>v' > output.csv`,
    params: [{ key: "value", label: "value", kind: "number", required: true, defaultValue: 0 }],
  },

  {
    type: "MAP_ADD",
    label: "MAP_ADD",
    unixHint: `${CSV_EXTRACT_COL1} | awk -v v=VALUE '{print $1+v}' > output.csv`,
    params: [{ key: "value", label: "value", kind: "number", required: true, defaultValue: 0 }],
  },
  {
    type: "MAP_MULTIPLY",
    label: "MAP_MULTIPLY",
    unixHint: `${CSV_EXTRACT_COL1} | awk -v v=VALUE '{print $1*v}' > output.csv`,
    params: [{ key: "value", label: "value", kind: "number", required: true, defaultValue: 1 }],
  },

  {
    type: "SORT_ASC",
    label: "SORT_ASC",
    unixHint: `${CSV_EXTRACT_COL1} | sort -n > output.csv`,
  },
  {
    type: "SORT_DESC",
    label: "SORT_DESC",
    unixHint: `${CSV_EXTRACT_COL1} | sort -nr > output.csv`,
  },

  {
    type: "OUTPUT_FIRST",
    label: "OUTPUT_FIRST",
    unixHint: `${CSV_EXTRACT_COL1} | head -n 1 > output.csv`,
  },
  {
    type: "OUTPUT_LAST",
    label: "OUTPUT_LAST",
    unixHint: `${CSV_EXTRACT_COL1} | tail -n 1 > output.csv`,
  },
  {
    type: "OUTPUT_SUM",
    label: "OUTPUT_SUM",
    unixHint: `${CSV_EXTRACT_COL1} | awk '{s+=$1} END{print s}' > output.csv`,
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
