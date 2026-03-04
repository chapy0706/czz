<!-- docs/how-it-works/mechanism-overview.md -->

# czz Mechanism Overview (Teacher Mode)

This document explains how czz works, focusing on the mechanism, data flow, and language boundaries. It is based on code references and avoids guessing beyond what is present.

**System Overview**

Data flows in four steps: Top -> Task -> Evaluate -> Result.

1. Top: The entry page renders the starting UI and navigation elements.
2. Task: The task page loads a task and hosts the command builder UI. It supports beginner mode and UNIX (advanced) mode via `uiModeStore`.
3. Evaluate: The evaluation API validates Runner I/O, resolves the user, validates input, runs the DSL tests, and optionally saves results.
4. Result: The result page reads evaluation output from a localStorage cache (`terminalStore`) and renders verdicts.

This flow is visible in the Top page, Task page, Evaluate API route, and Result page.

**Command Flow (CommandBuilder -> serializeProgram -> evaluateClient -> dsl-core -> testRunner)**

1. `commandBuilderStore` stores command drafts and `runnerIo` (the I/O presets). `serializeProgram()` emits `{ commands: unknown[] }` from the draft values.
2. `PipelinePanel` calls `serializeProgram()` and `getRunnerIo()` on submission, then passes them to `evaluateClient.ts`.
3. `evaluateClient.evaluateTask()` sends a POST to `/api/tasks/[taskId]/evaluate` with `submittedProgram` and `runnerIo`, then validates the response with `EvaluateResponseSchema`.
4. Note: `serialize.ts` (`buildResetKey`, `serializeCommandsForDisplay`) is for UI display only — it does not participate in the submission path.

**Evaluate Route Gate Order**

The route handles each concern in this sequence before returning a response.

1. Zod-parse `params` (UUID check) and `body` (`requestSchema`).
2. Runner I/O check (evaluate mode only): if `runnerIo` is missing or does not match `REQUIRED_RUNNER_IO` (`cat input.csv` / `>> output.csv`), return a TEST error immediately without calling the use case.
3. User resolution via Clerk auth or `userId` field: look up or create a user record in `DrizzleUserRepository`. Guards against reusing a Clerk-bound user ID as a guest.
4. Instantiate `EvaluateTaskUseCase` with `DrizzleTaskRepository` and `DrizzleResultRepository` and call `execute()`.
5. Normalize the use case result to `EvaluateResponseSchema` before returning.

**Persistence Flow (UseCase -> Repository -> Drizzle/PostgreSQL)**

1. The use case depends on `TaskRepository` and `ResultRepository` interfaces from the domain.
2. Infrastructure provides `DrizzleTaskRepository`, `DrizzleResultRepository`, and `DrizzleUserRepository` to implement those interfaces.
3. The use case writes results through the repository and handles FK failures without breaking evaluation.
4. If `userId` is absent (guest run) or a FK violation occurs, persistence is silently skipped and evaluation output is still returned.

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
3. The Task page triggers evaluation from the client via `evaluateClient.ts`, while the Evaluate API performs server-side validation and execution.
4. The Result page is a Client Component that reads from `useTerminalResultCacheStore` (localStorage via Zustand persist). No server fetch occurs on the result page itself.

**TypeScript Boundary Design (unknown -> Zod parse)**

The system treats external data as `unknown` and validates at boundaries.

1. Route params and request body are parsed with Zod schemas at the top of the handler.
2. `submittedProgram` is validated with `dslProgramSchema` inside the use case before execution.
3. Task `testCases` are stored as `unknown` in the domain entity (JSONB) and parsed with `dslTestCaseSchema` inside the use case.
4. The API response is normalized with `EvaluateResponseSchema.safeParse` before returning — an invalid shape returns HTTP 500 instead of leaking internal structure.
5. On the client, `evaluateClient.ts` also runs `EvaluateResponseSchema.safeParse` on the raw JSON before returning to the caller.

This pattern avoids trusting JSONB or client payloads directly and also protects the client from malformed server responses.

**Pitfall: Skipping Zod at a Boundary**

If you skip Zod validation for JSONB `testCases` or `submittedProgram`, `runTestCases` may execute invalid shapes and throw or produce misleading results. The use case intentionally parses both to avoid that failure mode.

**Pitfall: Submitting Without Runner I/O Set**

In evaluate mode the route requires `runnerIo.input = { kind: "cat", file: "input.csv" }` and `runnerIo.output = { kind: "append", file: "output.csv" }`. If the user has not selected both ends in the UI, the route returns a TEST error before the use case is called. The DSL execution result is never computed in that case.

**Reference Paths**

- `apps/user/app/page.tsx`
- `apps/user/app/tasks/[taskId]/page.tsx`
- `apps/user/app/api/tasks/[taskId]/evaluate/route.ts`
- `apps/user/app/result/page.tsx`
- `apps/user/src/lib/command-builder/commandBuilderStore.ts`
- `apps/user/src/lib/command-builder/serialize.ts` (display only — not submission)
- `apps/user/src/lib/command-builder/PipelinePanel.tsx`
- `apps/user/src/lib/terminal/evaluateClient.ts`
- `apps/user/src/lib/terminal/evaluateContract.ts`
- `apps/user/src/lib/terminal/runnerIo.ts`
- `apps/user/src/lib/terminal/terminalStore.ts`
- `apps/user/src/usecases/evaluateTask.ts`
- `packages/dsl-core/src/schema.ts`
- `packages/dsl-core/src/execute.ts`
- `packages/dsl-core/src/testRunner.ts`
- `packages/domain/src/entities/task.ts`
- `packages/domain/src/repositories/taskRepository.ts`
- `packages/domain/src/repositories/resultRepository.ts`
- `infra/drizzle/repositories/taskRepository.ts`
- `infra/drizzle/repositories/resultRepository.ts`
- `infra/drizzle/repositories/userRepository.ts`
