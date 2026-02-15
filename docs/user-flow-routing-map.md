# User Flow Routing Map (TOP → Tasks → Results)

## Routes
- `/` → `apps/user/app/page.tsx`
  - TOP entry point.
  - Shows entry to task list, and prompts sign-in when not logged in.
- `/tasks` → `apps/user/app/tasks/page.tsx`
  - Lists published tasks.
  - Entry for selecting a task to work on.
- `/tasks/[taskId]` → `apps/user/app/tasks/[taskId]/page.tsx`
  - Task detail and workspace.
  - Build pipeline with CommandBuilder, run, then navigate to `/result`.
- `/result` → `apps/user/app/result/page.tsx`
  - Shows latest cached result.
  - Displays test cases from cached evaluate response.
- `/results/running` → `apps/user/app/results/running/page.tsx`
  - Polls while evaluation is running.
  - Redirects to `/results/[resultId]` when complete.
- `/results/[resultId]` → `apps/user/app/results/[resultId]/page.tsx`
  - Result details for a specific result.
  - Fetches via API per `resultId`.

## Key State
- `uiModeStore`: `beginner` / `advanced` mode selection.
- `commandBuilderStore`: `commands`, `selectedId`, `editingId`, `runnerIo`.
- `resultId`: stored in client routing or API response for results pages.

## Primary Transitions
- `/` → `/tasks`
- `/tasks` → `/tasks/[taskId]`
- `/tasks/[taskId]` → `/result` → `/results/[resultId]`
