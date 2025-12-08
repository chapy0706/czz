// packages/dsl-core/src/execute.ts
import type { DslInput, DslOutput, DslProgram } from "./types";

export function execute(program: DslProgram, input: DslInput): DslOutput {
  return program.commands.reduce<DslOutput>((current, command) => {
    switch (command.type) {
      case "FILTER":
        return current.filter((value) => {
          if (command.predicate === "IS_EVEN") {
            return value % 2 === 0;
          }
          if (command.predicate === "IS_ODD") {
            return value % 2 !== 0;
          }
          // 予期しない predicate はとりあえず何もしない
          return true;
        });

      case "SORT":
        return [...current].sort((a, b) =>
          command.direction === "ASC" ? a - b : b - a,
        );

      default:
        // 未知のコマンドは無視（将来はエラーにしても良い）
        return current;
    }
  }, input);
}
