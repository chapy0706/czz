// apps/user/app/api/admin/tasks/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";

import { DrizzleTaskRepository } from "@/repositories/drizzleTaskRepository";
import { CreateTaskUseCase } from "@/usecases/createTask";

const ADMIN_ORIGIN =
  process.env.NEXT_PUBLIC_ADMIN_ORIGIN ?? "http://localhost:3001";

const corsHeaders = {
  "Access-Control-Allow-Origin": ADMIN_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// リクエストボディの Zod スキーマ
const createTaskBodySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  isPublished: z.boolean(),
  // DSL / TestCases は一旦 JSON なら何でも OK とする
  dslProgram: z.unknown(),
  testCases: z.unknown(),
  // 認証導入前なのでオプション扱い
  createdByUserId: z.string().uuid().optional(),
});

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  try{
    const json = await request.json();

    const parseResult = createTaskBodySchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "invalid_request",
          details: parseResult.error.flatten(),
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const body = parseResult.data;

    const repository = new DrizzleTaskRepository();
    const useCase = new CreateTaskUseCase(repository);

    const task = await useCase.execute({
      title: body.title,
      description: body.description,
      isPublished: body.isPublished,
      dslProgram: body.dslProgram,
      testCases: body.testCases,
      createdByUserId: body.createdByUserId,
    });

    return NextResponse.json(
      {
        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          isPublished: task.isPublished,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/tasks error:", error);

    return NextResponse.json(
      {
        error: "internal_server_error",
      },
      { status: 500 }
    );
  }
}
