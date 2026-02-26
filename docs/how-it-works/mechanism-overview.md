<!-- docs/how-it-works/mechanism-overview.md -->

# czz Mechanism Overview (Teacher Mode)

This document explains how czz works, focusing on the mechanism, data flow, and language boundaries. It is based on code references and avoids guessing beyond what is present.

**System Overview**

Data flows in four steps: Top -> Task -> Evaluate -> Result.

1. Top: The entry page renders the starting UI and navigation elements.
2. Task: The task page loads a task and hosts the command builder UI.
3. Evaluate: The evaluation API validates input, runs the DSL tests, and optionally saves results.
4. Result: The result page renders evaluation output and verdicts.

This flow is visible in the Top page, Task page, Evaluate API route, and Result page.

**Command Flow (CommandBuilder -> serialize -> dsl-core -> testRunner)**

1. CommandBuilder state stores commands and exposes `serializeProgram()` to emit `{ commands: unknown[] }` for submission.
2. The pipeline panel builds a digest, calls `serializeProgram()`, and sends the program to evaluation.
3. The evaluation route passes `submittedProgram` to the use case.
4. The use case validates with `dslProgramSchema` and runs tests with `runTestCases`.
5. The DSL engine executes each command in `execute()` and aggregates results in `testRunner`.

**Persistence Flow (UseCase -> Repository -> Drizzle/PostgreSQL)**

1. The use case depends on `TaskRepository` and `ResultRepository` interfaces from the domain.
2. Infrastructure provides `DrizzleTaskRepository` and `DrizzleResultRepository` to implement those interfaces.
3. The use case writes results through the repository and handles FK failures without breaking evaluation.

**Clean Architecture Dependency Direction**

The dependencies point inward.

1. UI and API (apps) depend on application use cases.
2. Use cases depend on domain interfaces, not infra.
3. Infra implements repositories and depends on domain types.
4. `packages/dsl-core` stays domain-agnostic and is used by the use case.

This keeps business rules stable and enables swapping infrastructure without changing application logic.

**Next.js App Router Dependencies**

The system relies on App Router conventions.

1. Server handlers live in `app/api/**/route.ts` and return `NextResponse`.
2. Client Components explicitly opt into client-side behavior via `"use client"` in task and result pages.
3. The Task page fetches via `fetch()` from the client, while the Evaluate API performs server-side validation and execution.

**TypeScript Boundary Design (unknown -> Zod parse)**

The system treats external data as `unknown` and validates at boundaries.

1. Requests to the Evaluate API are parsed with Zod schemas.
2. `submittedProgram` is validated with `dslProgramSchema` before execution.
3. Task `testCases` are stored as `unknown` in the domain entity and are parsed with Zod inside the use case.
4. API responses are normalized with `EvaluateResponseSchema` before being sent.

This pattern avoids trusting JSONB or client payloads directly.

**Pitfall Example**

If you skip Zod validation for JSONB `testCases` or `submittedProgram`, `runTestCases` may execute invalid shapes and throw or produce misleading results. The use case intentionally parses both to avoid that failure mode.

**Reference Paths**

- `apps/user/app/page.tsx`
- `apps/user/app/tasks/[taskId]/page.tsx`
- `apps/user/app/api/tasks/[taskId]/evaluate/route.ts`
- `apps/user/app/result/page.tsx`
- `apps/user/src/lib/command-builder/commandBuilderStore.ts`
- `apps/user/src/lib/command-builder/serialize.ts`
- `apps/user/src/lib/command-builder/PipelinePanel.tsx`
- `apps/user/src/usecases/evaluateTask.ts`
- `packages/dsl-core/src/schema.ts`
- `packages/dsl-core/src/execute.ts`
- `packages/dsl-core/src/testRunner.ts`
- `packages/domain/src/entities/task.ts`
- `packages/domain/src/repositories/taskRepository.ts`
- `packages/domain/src/repositories/resultRepository.ts`
- `infra/drizzle/repositories/taskRepository.ts`
- `infra/drizzle/repositories/resultRepository.ts`
