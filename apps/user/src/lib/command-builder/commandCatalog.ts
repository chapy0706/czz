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

export const COMMAND_CATALOG: CommandCatalogItem[] = [
  {
    type: "FILTER_EQUALS",
    label: "FILTER_EQUALS",
    unixHint: "grep (exact match)",
    params: [{ key: "value", label: "value", kind: "number", required: true, defaultValue: 0 }],
  },
  {
    type: "FILTER_NOT_EQUALS",
    label: "FILTER_NOT_EQUALS",
    unixHint: "grep -v (exclude)",
    params: [{ key: "value", label: "value", kind: "number", required: true, defaultValue: 0 }],
  },
  {
    type: "FILTER_GT",
    label: "FILTER_GT",
    unixHint: "awk '$0 > x'",
    params: [{ key: "value", label: "value", kind: "number", required: true, defaultValue: 0 }],
  },

  {
    type: "MAP_ADD",
    label: "MAP_ADD",
    unixHint: "awk '{print $0  x}'",
    params: [{ key: "value", label: "value", kind: "number", required: true, defaultValue: 0 }],
  },
  {
    type: "MAP_MULTIPLY",
    label: "MAP_MULTIPLY",
    unixHint: "awk '{print $0 * x}'",
    params: [{ key: "value", label: "value", kind: "number", required: true, defaultValue: 1 }],
  },

  { type: "SORT_ASC", label: "SORT_ASC", unixHint: "sort" },
  { type: "SORT_DESC", label: "SORT_DESC", unixHint: "sort -r" },

  { type: "OUTPUT_FIRST", label: "OUTPUT_FIRST", unixHint: "head -n 1" },
  { type: "OUTPUT_LAST", label: "OUTPUT_LAST", unixHint: "tail -n 1" },
  { type: "OUTPUT_SUM", label: "OUTPUT_SUM", unixHint: "sum/awk '{s+=$1} END{print s}'" },
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
