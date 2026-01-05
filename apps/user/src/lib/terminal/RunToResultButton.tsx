// apps/user/src/components/terminal/RunToResultButton.tsx
"use client";

import { useRunToResultButton } from "@/lib/terminal/useRunToResultButton";

type Props = {
  taskId: string | null;
  resetKey: string;
  getSubmittedProgram: () => unknown;
  userId?: string;

  /**
   * 既定: "/result"
   */
  navigateTo?: string;

  /**
   * Tailwind className (optional)
   */
  className?: string;

  /**
   * data-testid (optional) - default "cb-run"
   */
  testId?: string;

  /**
   * A案: true の場合、判定完了後に自動で navigateTo へ遷移する。
   * 既定: true
   */
  autoNavigateOnComplete?: boolean;
};

export function RunToResultButton(props: Props) {
  const {
    taskId,
    resetKey,
    getSubmittedProgram,
    userId,
    navigateTo,
    className = "rounded border px-3 py-2 text-sm disabled:opacity-50",
    testId = "cb-run",
    autoNavigateOnComplete,
  } = props;

  const run = useRunToResultButton({
    taskId,
    resetKey,
    getSubmittedProgram,
    userId,
    navigateTo,
    autoNavigateOnComplete,
  });

  return (
    <button
      type="button"
      className={className}
      data-testid={testId}
      onClick={run.onClick}
      disabled={run.disabled}
      title={run.title}
    >
      {run.label}
    </button>
  );
}
