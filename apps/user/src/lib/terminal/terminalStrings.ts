// apps/user/src/lib/terminal/terminalStrings.ts

export type TerminalStringKey =
	| "result"
	| "success"
	| "failure"
	| "hint"
	| "output"
	| "expected"
	| "empty"
	| "unknownError";

const terminalText: Record<TerminalStringKey, { en: string; ja: string }> = {
	result: { en: "Result", ja: "結果" },
	success: { en: "SUCCESS", ja: "成功" },
	failure: { en: "FAILURE", ja: "失敗" },
	hint: { en: "Hint", ja: "ヒント" },
	output: { en: "Output", ja: "出力" },
	expected: { en: "Expected", ja: "期待値" },
	empty: { en: "(empty)", ja: "（空）" },
	unknownError: { en: "Unknown error", ja: "不明なエラー" },
};

export function tTerminal(
	key: TerminalStringKey,
	mode: "beginner" | "advanced",
): string {
	const value = terminalText[key];
	return mode === "beginner" ? value.ja : value.en;
}
