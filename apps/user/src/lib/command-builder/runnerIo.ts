// apps/user/src/lib/command-builder/runnerIo.ts

export type RunnerInputPreset = "unset" | "cat_input_csv";
export type RunnerOutputPreset =
	| "unset"
	| "redirect_output_csv"
	| "append_output_csv";

export type RunnerIo = {
	input: RunnerInputPreset;
	output: RunnerOutputPreset;
};

// UI が Select / Dropdown を作るための候補一覧（互換用）
export const RUNNER_INPUT_PRESETS: ReadonlyArray<RunnerInputPreset> = [
	"unset",
	"cat_input_csv",
];

export const RUNNER_OUTPUT_PRESETS: ReadonlyArray<RunnerOutputPreset> = [
	"unset",
	"redirect_output_csv",
	"append_output_csv",
];

export const DEFAULT_RUNNER_IO: RunnerIo = {
	input: "unset",
	output: "unset",
};

// Backward-compat alias (older code expected this name)
export const defaultRunnerIo: RunnerIo = DEFAULT_RUNNER_IO;

// “正解”の定義（要件に合わせて >> を正解にしてある）
export function isRunnerIoCorrect(io: RunnerIo): boolean {
	return io.input === "cat_input_csv" && io.output === "append_output_csv";
}

export function runnerInputCmd(preset: RunnerInputPreset): string {
	switch (preset) {
		case "cat_input_csv":
			return "cat input.csv";
		default:
			return "□";
	}
}

export function runnerOutputCmd(preset: RunnerOutputPreset): string {
	switch (preset) {
		case "redirect_output_csv":
			return "> output.csv";
		case "append_output_csv":
			return ">> output.csv";
		default:
			return "□";
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
