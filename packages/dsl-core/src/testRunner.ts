// packages/dsl-core/src/testRunner.ts
import { execute } from "./execute";
import type { DslProgram, DslTestCase } from "./schema";

export type SingleTestCaseResult = {
  index: number;
  input: number[];
  expected: number[];
  actual: number[];
  passed: boolean;
};

export type TestCasesResult = {
  allPassed: boolean;
  results: SingleTestCaseResult[];
};

export function runSingleTestCase(
  program: DslProgram,
  testCase: DslTestCase,
  index = 0,
): SingleTestCaseResult {
  const actual = execute(program, testCase.input);

  const passed =
    actual.length === testCase.expected.length &&
    actual.every((value, i) => value === testCase.expected[i]);

  return {
    index,
    input: testCase.input,
    expected: testCase.expected,
    actual,
    passed,
  };
}

export function runTestCases(
  program: DslProgram,
  testCases: DslTestCase[],
): TestCasesResult {
  const results = testCases.map((tc, i) => runSingleTestCase(program, tc, i));

  const allPassed = results.every((r) => r.passed);

  return {
    allPassed,
    results,
  };
}
