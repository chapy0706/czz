// packages/dsl-core/src/execute.test.ts
import { describe, expect, it } from "vitest";
import { execute } from "./execute";
import type { DslProgram } from "./types";

describe("execute", () => {
  it("FILTER IS_EVEN を適用して偶数だけを残せる", () => {
    const program: DslProgram = {
      commands: [
        {
          type: "FILTER",
          predicate: "IS_EVEN",
        },
      ],
    };

    const result = execute(program, [1, 2, 3, 4, 5, 6]);

    expect(result).toEqual([2, 4, 6]);
  });
});
