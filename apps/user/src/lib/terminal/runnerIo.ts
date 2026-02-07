// apps/user/src/lib/terminal/runnerIo.ts
export type RunnerInput = {
	kind: "cat";
	file: string;
};

export type RunnerOutput = {
	kind: "append" | "overwrite";
	file: string;
};

export type RunnerIo = {
	input: RunnerInput | null;
	output: RunnerOutput | null;
};

export const REQUIRED_RUNNER_IO = {
	input: { kind: "cat", file: "input.csv" },
	output: { kind: "append", file: "output.csv" },
} as const;

export function formatRunnerInput(input: RunnerInput | null): string {
	return input ? `cat ${input.file}` : "□";
}

export function formatRunnerOutput(output: RunnerOutput | null): string {
	if (!output) return "□";
	return `${output.kind === "append" ? ">>" : ">"} ${output.file}`;
}

/**
 * Output は 3段階で回す：未設定 → overwrite(>) → append(>>) → 未設定
 * （わざと “間違える余地” を残して学習用にする）
 */
export function cycleRunnerOutput(
	current: RunnerOutput | null,
): RunnerOutput | null {
	if (!current) return { kind: "overwrite", file: "output.csv" };
	if (current.kind === "overwrite")
		return { kind: "append", file: "output.csv" };
	return null;
}
