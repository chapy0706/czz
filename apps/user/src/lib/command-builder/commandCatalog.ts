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

export type CommandCatalogItem = {
  type: CommandType;
  label: string;
  unixHint: string;
  // ここは “UIフォーム化” する時に使う。まずは JSON 編集シートで逃がす。
  needsParams: boolean;
};

export const COMMAND_CATALOG: CommandCatalogItem[] = [
  { type: "FILTER_EQUALS", label: "FILTER_EQUALS", unixHint: "grep (exact match)", needsParams: true },
  { type: "FILTER_NOT_EQUALS", label: "FILTER_NOT_EQUALS", unixHint: "grep -v (exclude)", needsParams: true },
  { type: "FILTER_GT", label: "FILTER_GT", unixHint: "awk '$0 > x'", needsParams: true },

  { type: "MAP_ADD", label: "MAP_ADD", unixHint: "awk '{print $0 + x}'", needsParams: true },
  { type: "MAP_MULTIPLY", label: "MAP_MULTIPLY", unixHint: "awk '{print $0 * x}'", needsParams: true },

  { type: "SORT_ASC", label: "SORT_ASC", unixHint: "sort", needsParams: false },
  { type: "SORT_DESC", label: "SORT_DESC", unixHint: "sort -r", needsParams: false },

  { type: "OUTPUT_FIRST", label: "OUTPUT_FIRST", unixHint: "head -n 1", needsParams: false },
  { type: "OUTPUT_LAST", label: "OUTPUT_LAST", unixHint: "tail -n 1", needsParams: false },
  { type: "OUTPUT_SUM", label: "OUTPUT_SUM", unixHint: "sum/awk '{s+=$1} END{print s}'", needsParams: false },
];
