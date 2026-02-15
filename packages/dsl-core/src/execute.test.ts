// packages/dsl-core/src/execute.test.ts
import { describe, expect, it } from "vitest";
import { execute } from "./execute";
import { dslProgramSchema } from "./schema";

describe("execute - 基本命令", () => {
	it("FILTER_EQUALS で指定値だけ残す", () => {
		const programJson = {
			commands: [{ type: "FILTER_EQUALS", value: 2 }],
		};

		const program = dslProgramSchema.parse(programJson);

		const result = execute(program, [1, 2, 2, 3]);

		expect(result).toEqual([2, 2]);
	});

	it("FILTER_EQUALS は文字列数値を許容する", () => {
		const programJson = {
			commands: [{ type: "FILTER_EQUALS", value: "2" }],
		} as const;

		const program = dslProgramSchema.parse(programJson);

		const result = execute(program, [1, 2, 2, 3]);

		expect(result).toEqual([2, 2]);
	});

	it("FILTER_BETWEEN は from==to でも一致を残す", () => {
		const programJson = {
			commands: [{ type: "FILTER_BETWEEN", min: 2, max: 2 }],
		};

		const program = dslProgramSchema.parse(programJson);

		const result = execute(program, [1, 2, 2, 3]);

		expect(result).toEqual([2, 2]);
	});

	it("FILTER_BETWEEN は範囲内を残す", () => {
		const programJson = {
			commands: [{ type: "FILTER_BETWEEN", min: 2, max: 4 }],
		};

		const program = dslProgramSchema.parse(programJson);

		const result = execute(program, [1, 2, 3, 4, 5]);

		expect(result).toEqual([2, 3, 4]);
	});

	it("FILTER_LT は指定値未満を残す", () => {
		const programJson = {
			commands: [{ type: "FILTER_LT", value: 3 }],
		};

		const program = dslProgramSchema.parse(programJson);

		const result = execute(program, [1, 2, 3, 4, 5]);

		expect(result).toEqual([1, 2]);
	});

	it("MAP_ADD で値を加算する", () => {
		const programJson = {
			commands: [{ type: "MAP_ADD", value: 10 }],
		};

		const program = dslProgramSchema.parse(programJson);

		const result = execute(program, [1, 2, 3]);

		expect(result).toEqual([11, 12, 13]);
	});

	it("SORT_DESC で降順ソートする", () => {
		const programJson = {
			commands: [{ type: "SORT_DESC" }],
		};

		const program = dslProgramSchema.parse(programJson);

		const result = execute(program, [3, 1, 2]);

		expect(result).toEqual([3, 2, 1]);
	});

	it("複数命令を組み合わせて実行できる", () => {
		const programJson = {
			commands: [
				{ type: "FILTER_GT", value: 2 },
				{ type: "MAP_MULTIPLY", value: 2 },
				{ type: "SORT_ASC" },
			],
		};

		const program = dslProgramSchema.parse(programJson);

		const result = execute(program, [1, 2, 3, 4]);

		// 2 より大きい → [3,4]
		// *2 → [6,8]
		// 昇順 → [6,8]
		expect(result).toEqual([6, 8]);
	});
});
