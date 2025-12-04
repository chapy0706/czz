// apps/user/app/api/tasks/route.ts

import { DrizzleTaskRepository } from "@/repositories/drizzleTaskRepository";
import { ListPublishedTasksUseCase } from "@/usecases/listPublishedTasks";
import { NextResponse } from "next/server";

/**
 * GET /api/tasks
 * 公開済みタスク一覧を返すエンドポイント
 */
export async function GET() {
  try {
    // Infrastructure の具体実装
    const repository = new DrizzleTaskRepository();

    // UseCase に Repository 抽象を渡す（依存性注入）
    const useCase = new ListPublishedTasksUseCase(repository);

    // ユースケース実行
    const tasks = await useCase.execute();

    // そのまま返してもいいが、一旦 API 用 DTO に整形しておく
    const payload = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      isPublished: task.isPublished,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));

    return NextResponse.json(
      {
        tasks: payload,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/tasks error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch tasks",
      },
      { status: 500 }
    );
  }
}
