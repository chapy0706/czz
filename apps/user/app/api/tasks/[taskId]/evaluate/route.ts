// apps/user/src/app/api/tasks/[taskId]/evaluate/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { EvaluateTaskUseCase } from "@/usecases/evaluateTask";

// infra
import { DrizzleResultRepository } from "@infra/drizzle/repositories/resultRepository";
import { DrizzleTaskRepository } from "@infra/drizzle/repositories/taskRepository";

const requestSchema = z.object({
  userId: z.string().min(1),
  submittedProgram: z.unknown(),
});

export async function POST(
  req: Request,
  ctx: { params: { taskId: string } },
) {
  try {
    const { taskId } = ctx.params;

    const body = await req.json();
    const parsed = requestSchema.parse(body);

    const usecase = new EvaluateTaskUseCase({
      taskRepository: new DrizzleTaskRepository(),
      resultRepository: new DrizzleResultRepository(),
    });

    const result = await usecase.execute({
      taskId,
      userId: parsed.userId,
      submittedProgram: parsed.submittedProgram,
    });

    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (e) {
    // Zod の場合は 400 に寄せる
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "Bad Request", details: e.flatten() },
        { status: 400 },
      );
    }

    // Task not found など、ドメイン寄りのエラーは 404/500 を検討
    const message = e instanceof Error ? e.message : "Unknown error";
    const status = message === "Task not found" ? 404 : 500;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
