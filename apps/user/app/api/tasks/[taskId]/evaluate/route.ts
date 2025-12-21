// apps/user/src/app/api/tasks/[taskId]/evaluate/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { EvaluateResponseSchema } from "@/lib/terminal/evaluateContract";
import { EvaluateTaskUseCase } from "@/usecases/evaluateTask";

// infra
import { DrizzleResultRepository } from "@infra/drizzle/repositories/resultRepository";
import { DrizzleTaskRepository } from "@infra/drizzle/repositories/taskRepository";

const paramsSchema = z.object({ taskId: z.string().uuid() });
// userId はゲスト実行では不要（保存しない）
const requestSchema = z.object({
  userId: z.string().uuid().optional(),
  submittedProgram: z.unknown(),
});

export async function POST(
  req: Request,
  ctx: { params: { taskId: string } },
) {
  try {
    const { taskId } = paramsSchema.parse(ctx.params);

    const body = await req.json();
    const parsed = requestSchema.parse(body);

    const usecase = new EvaluateTaskUseCase({
      taskRepository: new DrizzleTaskRepository(),
      resultRepository: new DrizzleResultRepository(),
    });

    const result = await usecase.execute({
      taskId,
      // userId が無い場合は保存しない想定（usecase 側で分岐）
      userId: parsed.userId,
      submittedProgram: parsed.submittedProgram,
    });

    // UseCase は runTestCases の結果を返す。
    // API 層で EvaluateResponse（契約）に正規化して返す。
    const any = result as any;
    const results = Array.isArray(any?.results) ? any.results : null;
    const total = results ? results.length : NaN;
    const passed = results
      ? results.filter((r: any) => r && r.passed === true).length
      : NaN;
    const allPassed = typeof any?.allPassed === "boolean" ? any.allPassed : (results ? passed === total : false);
    // “出力” は DSL の性質上いろいろありうるので、まずは「最後の actual」を採用
    const output =
      results && results.length > 0
        ? results[results.length - 1]?.actual
        : undefined;

    // runTestCases の戻り値が想定外なら、ここで落としてズレを露出させる
    if (!results || !Number.isFinite(passed) || !Number.isFinite(total) || passed < 0 || total < 0) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            kind: "UNKNOWN",
            message: "Invalid runTestCases result shape",
            details: result,
          },
        },
        { status: 500 },
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

    // 念のため契約チェック（ここは通るはず）
    const normalized = EvaluateResponseSchema.safeParse(response);
    if (!normalized.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            kind: "UNKNOWN",
            message: "Invalid API response shape",
            details: normalized.error.flatten(),
          },
        },
        { status: 500 },
      );
    }

    return NextResponse.json(normalized.data, { status: 200 });
  } catch (e) {
    // Zod の場合は 400 （契約に寄せる）
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            kind: "ZOD",
            message: "Bad Request",
            details: e.flatten(),
          },
        },
        { status: 400 },
      );
    }

    // Task not found など、ドメイン寄りのエラーは 404/500 を検討
    const message = e instanceof Error ? e.message : "Unknown error";
    const status = message === "Task not found" ? 404 : 500;

    return NextResponse.json(
      {
        ok: false,
        error: {
          kind: "UNKNOWN",
          message,
        },
      },
      { status },
    );
  }
}
