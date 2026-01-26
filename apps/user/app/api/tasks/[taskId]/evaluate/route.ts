// apps/user/src/app/api/tasks/[taskId]/evaluate/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  EvaluateRequestSchema,
  EvaluateResponseSchema,
  type EvaluateResponse,
} from "@/lib/terminal/evaluateContract";
import { EvaluateTaskUseCase } from "@/usecases/evaluateTask";

// infra
import { DrizzleResultRepository } from "@infra/drizzle/repositories/resultRepository";
import { DrizzleTaskRepository } from "@infra/drizzle/repositories/taskRepository";

const paramsSchema = z.object({ taskId: z.string().uuid() });

function toZodErrorResponse(e: z.ZodError) {
  const res: EvaluateResponse = {
    ok: false,
    error: { kind: "ZOD", message: "Bad Request", details: e.flatten() },
  };
  return NextResponse.json(res, { status: 400 });
}

function toUnknownErrorResponse(
  message: string,
  details?: unknown,
  status = 500,
) {
  const res: EvaluateResponse = {
    ok: false,
    error: { kind: "UNKNOWN", message, details },
  };
  return NextResponse.json(res, { status });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = paramsSchema.parse(await ctx.params);

    const body = await req.json().catch(() => null);
    const parsed = EvaluateRequestSchema.parse(body);

    const usecase = new EvaluateTaskUseCase({
      taskRepository: new DrizzleTaskRepository(),
      resultRepository: new DrizzleResultRepository(),
    });

    // 既存UseCaseが debugInput/dryRun/purpose を受け取れる場合は活かす。
    // 受け取れない場合でも、as any でコンパイルを通しつつ挙動は従来のまま。
    const result = await usecase.execute({
      taskId,
      userId: parsed.userId,
      submittedProgram: parsed.submittedProgram,

      debugInput: parsed.debugInput,
      dryRun: parsed.dryRun,
      purpose: parsed.purpose,
    } as any);

    // ---------- Debug/Playground モード ----------
    // 現時点ではサーバー実装が未対応でも UI が動くように、最低限の shape を返す。
    // 実際に debugInput で実行する処理は、UseCase/DSL実行部分の拡張で行う（次ステップ）。
    if (parsed.purpose === "debug" || parsed.dryRun === true) {
      const any = result as any;
      const results = Array.isArray(any?.results) ? any.results : null;

      // 可能なら debugOutput / output を優先、無ければ「最後の actual」を拾う（暫定）
      const output =
        any?.debugOutput ??
        any?.output ??
        (results && results.length > 0
          ? results[results.length - 1]?.actual
          : undefined);

      const response = { ok: true, passed: 0, total: 0, output } as const;
      const normalized = EvaluateResponseSchema.safeParse(response);
      if (!normalized.success) {
        return toUnknownErrorResponse(
          "Invalid API response shape (debug)",
          normalized.error.flatten(),
          500,
        );
      }
      return NextResponse.json(normalized.data, { status: 200 });
    }

    // ---------- 通常モード（テスト判定） ----------
    const any = result as any;
    const results = Array.isArray(any?.results) ? any.results : null;
    const total = results ? results.length : NaN;
    const passed = results
      ? results.filter((r: any) => r && r.passed === true).length
      : NaN;

    const allPassed =
      typeof any?.allPassed === "boolean"
        ? any.allPassed
        : results
          ? passed === total
          : false;

    // “出力” は DSL の性質上いろいろありうるので、まずは「最後の actual」を採用
    const output =
      results && results.length > 0
        ? results[results.length - 1]?.actual
        : undefined;

    if (
      !results ||
      !Number.isFinite(passed) ||
      !Number.isFinite(total) ||
      passed < 0 ||
      total < 0
    ) {
      return toUnknownErrorResponse(
        "Invalid runTestCases result shape",
        result,
        500,
      );
    }

    const response = allPassed
      ? ({ ok: true, passed, total, output } as const)
      : ({
          ok: false,
          passed,
          total,
          error: {
            kind: "TEST",
            message: "Some test cases failed",
            details: { result },
          },
        } as const);

    const normalized = EvaluateResponseSchema.safeParse(response);
    if (!normalized.success) {
      return toUnknownErrorResponse(
        "Invalid API response shape",
        normalized.error.flatten(),
        500,
      );
    }

    return NextResponse.json(normalized.data, { status: 200 });
  } catch (e) {
    if (e instanceof z.ZodError) return toZodErrorResponse(e);

    const message = e instanceof Error ? e.message : "Unknown error";
    const status = message === "Task not found" ? 404 : 500;
    return toUnknownErrorResponse(message, undefined, status);
  }
}
