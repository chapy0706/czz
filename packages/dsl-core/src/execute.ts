// packages/dsl-core/src/execute.ts
import type { DslCommand, DslProgram } from "./schema";

export type DslInput = number[];
export type DslOutput = number[];

// 安全のため、常に新しい配列を返す
export function execute(program: DslProgram, input: DslInput): DslOutput {
	let current: DslOutput = [...input];

	for (const command of program.commands) {
		current = applyCommand(command, current);
	}

	return current;
}

function applyCommand(command: DslCommand, input: DslInput): DslOutput {
	switch (command.type) {
		case "FILTER_EQUALS":
			return input.filter((v) => v === command.value);

		case "FILTER_NOT_EQUALS":
			return input.filter((v) => v !== command.value);

		case "FILTER_GT":
			return input.filter((v) => v > command.value);

		case "FILTER_LT":
			return input.filter((v) => v < command.value);

		case "FILTER_BETWEEN":
			return input.filter((v) => v >= command.min && v <= command.max);

		case "MAP_ADD":
			return input.map((v) => v + command.value);

		case "MAP_MULTIPLY":
			return input.map((v) => v * command.value);

		case "SORT_ASC":
			return [...input].sort((a, b) => a - b);

		case "SORT_DESC":
			return [...input].sort((a, b) => b - a);

		case "OUTPUT_FIRST":
			// OUTPUT 系は「配列に戻す」仕様にしておくと扱いやすい
			return input.length > 0 ? [input[0]] : [];

		case "OUTPUT_LAST":
			return input.length > 0 ? [input[input.length - 1]] : [];

		case "OUTPUT_SUM": {
			const sum = input.reduce((acc, v) => acc + v, 0);
			return [sum];
		}

		case "OUTPUT_COUNT":
			return [input.length];

		default: {
			// TypeScript 的には到達しないが、安全のため
			const _exhaustiveCheck: never = command;
			return input;
		}
	}
}
