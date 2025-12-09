import { describe, expect, it } from "vitest";
import { dslProgramSchema, dslTestCaseSchema } from "./schema";
import { runTestCases } from "./testRunner";

describe("runTestCases", () => {
  it("全テストケースが成功する場合 allPassed が true になる", () => {
    const program = dslProgramSchema.parse({
      commands: [{ type: "MAP_ADD", value: 1 }],
    });

    const testCases = [
      { input: [1, 2], expected: [2, 3] },
      { input: [0], expected: [1] },
    ].map((tc) => dslTestCaseSchema.parse(tc));

    const result = runTestCases(program, testCases);

    expect(result.allPassed).toBe(true);
    expect(result.results).toHaveLength(2);
    expect(result.results[0].passed).toBe(true);
  });

  it("1つでも失敗があれば allPassed が false になる", () => {
    const program = dslProgramSchema.parse({
      commands: [{ type: "MAP_ADD", value: 1 }],
    });

    const testCases = [
      { input: [1], expected: [2] }, // OK
      { input: [1], expected: [3] }, // NG
    ].map((tc) => dslTestCaseSchema.parse(tc));

    const result = runTestCases(program, testCases);

    expect(result.allPassed).toBe(false);
    expect(result.results[1].passed).toBe(false);
  });
});
