// apps/user/app/api/tasks/[taskId]/evaluate/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { EvaluateResponseSchema } from "@/lib/terminal/evaluateContract";
import { EvaluateTaskUseCase } from "@/usecases/evaluateTask";

// infra
import { DrizzleResultRepository } from "@infra/drizzle/repositories/resultRepository";
import { DrizzleTaskRepository } from "@infra/drizzle/repositories/taskRepository";

const ParamsSchema = z.object({
  taskId: z.string().min(1),
});

const BodySchema = z.object({
  userId: z.string().min(1).optional(),
  submittedProgram: z.unknown(),
});

function countPassed(results: unknown[]): number {
  // dsl-core の TestCaseResult は { passed: boolean, ... } を想定。
  // ただし将来形が変わっても壊れにくいように “それっぽい” 真偽値を拾う。
  let passed = 0;
  for (const r of results) {
    if (!r || typeof r !== "object") continue;
    const any = r as any;
    if (any.passed === true) passed++;
    else if (any.ok === true) passed++;
  }
  return passed;
}

function pickOutputFromResults(results: unknown[]): unknown | undefined {
  // UI の “ちょい見せ” 用。無いなら undefined でOK。
  // よくあるキー: output / actual / stdout
  for (let i = results.length - 1; i >= 0; i--) {
    const r = results[i];
    if (!r || typeof r !== "object") continue;
    const any = r as any;
    if (any.output !== undefined) return any.output;
    if (any.actual !== undefined) return any.actual;
    if (any.stdout !== undefined) return any.stdout;
  }
  return undefined;
}

export async function POST(req: Request, ctx: { params: unknown }) {
  const paramsParsed = ParamsSchema.safeParse((ctx as any)?.params);
  if (!paramsParsed.success) {
    return NextResponse.json(
      EvaluateResponseSchema.parse({
        ok: false,
        error: {
          kind: "ZOD",
          message: "Invalid route params",
          details: paramsParsed.error.flatten(),
        },
      }),
      { status: 400 },
    );
  }

  const json = await req.json().catch(() => null);
  const bodyParsed = BodySchema.safeParse(json);
  if (!bodyParsed.success) {
    return NextResponse.json(
      EvaluateResponseSchema.parse({
        ok: false,
        error: {
          kind: "ZOD",
          message: "Invalid request body",
          details: bodyParsed.error.flatten(),
        },
      }),
      { status: 400 },
    );
  }

  const { taskId } = paramsParsed.data;
  const { userId, submittedProgram } = bodyParsed.data;

  try {
    const usecase = new EvaluateTaskUseCase({
      taskRepository: new DrizzleTaskRepository(),
      resultRepository: new DrizzleResultRepository(),
    });

    const testCasesResult = await usecase.execute({
      taskId,
      userId,
      submittedProgram,
    });

    // dsl-core: { allPassed: boolean, results: TestCaseResult[] }
    const any = testCasesResult as any;
    const results: unknown[] = Array.isArray(any?.results) ? any.results : [];
    const total = results.length;
    const passed = countPassed(results);
    const output = pickOutputFromResults(results);

    return NextResponse.json(
      EvaluateResponseSchema.parse({
        ok: true,
        passed,
        total,
        ...(output !== undefined ? { output } : {}),
      }),
    );
  } catch (e: any) {
    // ZodError もここに来る可能性があるので、内容は details に落とす
    const isZod =
      e &&
      typeof e === "object" &&
      (e.name === "ZodError" || typeof e.issues === "object");

    const kind = isZod ? "ZOD" : "UNKNOWN";
    const message = isZod
      ? "Submitted program is invalid"
      : (e?.message ?? "Unknown error");

    return NextResponse.json(
      EvaluateResponseSchema.parse({
        ok: false,
        error: {
          kind,
          message,
          details: isZod
            ? ((e as any).flatten?.() ?? (e as any).issues ?? e)
            : String(e),
        },
      }),
      { status: 500 },
    );
  }
}
