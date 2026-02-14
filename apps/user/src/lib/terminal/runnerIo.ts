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

export type RunnerInputPreset = "unset" | "cat_input_csv";
export type RunnerOutputPreset =
	| "unset"
	| "redirect_output_csv"
	| "append_output_csv";

export type RunnerIoPreset = {
	input: RunnerInputPreset;
	output: RunnerOutputPreset;
};

export const RUNNER_INPUT_PRESETS: ReadonlyArray<RunnerInputPreset> = [
	"unset",
	"cat_input_csv",
];

export const RUNNER_OUTPUT_PRESETS: ReadonlyArray<RunnerOutputPreset> = [
	"unset",
	"redirect_output_csv",
	"append_output_csv",
];

export const DEFAULT_RUNNER_IO: RunnerIoPreset = {
	input: "unset",
	output: "unset",
};

export const defaultRunnerIo: RunnerIoPreset = DEFAULT_RUNNER_IO;

export const REQUIRED_RUNNER_IO = {
	input: { kind: "cat", file: "input.csv" },
	output: { kind: "append", file: "output.csv" },
} as const;

export function toRunnerIo(
	preset: RunnerIoPreset | null | undefined,
): RunnerIo {
	if (!preset) return { input: null, output: null };

	const input: RunnerInput | null =
		preset.input === "cat_input_csv"
			? { kind: "cat", file: "input.csv" }
			: null;

	let output: RunnerOutput | null = null;
	if (preset.output === "redirect_output_csv") {
		output = { kind: "overwrite", file: "output.csv" };
	} else if (preset.output === "append_output_csv") {
		output = { kind: "append", file: "output.csv" };
	}

	return { input, output };
}

export function isRunnerIoCorrect(io: RunnerIoPreset): boolean {
	return io.input === "cat_input_csv" && io.output === "append_output_csv";
}

export function runnerInputCmd(
	preset: RunnerInputPreset | null | undefined,
): string {
	switch (preset) {
		case "cat_input_csv":
			return "cat input.csv";
		default:
			return "入力未設定";
	}
}

export function runnerOutputCmd(
	preset: RunnerOutputPreset | null | undefined,
): string {
	switch (preset) {
		case "redirect_output_csv":
			return "> output.csv";
		case "append_output_csv":
			return ">> output.csv";
		default:
			return "出力未設定";
	}
}

export function runnerInputLabel(preset: RunnerInputPreset): string {
	switch (preset) {
		case "cat_input_csv":
			return "cat input.csv";
		default:
			return "未選択（□）";
	}
}

export function runnerOutputLabel(preset: RunnerOutputPreset): string {
	switch (preset) {
		case "redirect_output_csv":
			return "> output.csv（上書き）";
		case "append_output_csv":
			return ">> output.csv（追記）";
		default:
			return "未選択（□）";
	}
}

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
