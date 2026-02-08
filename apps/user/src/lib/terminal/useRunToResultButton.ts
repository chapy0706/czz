// apps/user/src/lib/terminal/useRunToResultButton.ts
"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type MaybePromise<T> = T | Promise<T>;

type UseRunToResultButtonOptions = Readonly<{
  taskId: string;
  resetKey: string;

  /**
   * 実行前に「最新の提出プログラム」を確定させたい場合のフック。
   * 例: Zustandのstoreへcommitする、などの副作用に使う。
   */
  getSubmittedProgram?: () => MaybePromise<unknown>;

  /**
   * 遷移先を差し替えたい場合に使う。
   * 例: `/tasks/:id/result` や `/result?taskId=...` など。
   */
  navigateTo?: (taskId: string) => string;

  /**
   * 将来の拡張用。現状は遷移のみ（完了検知の自動遷移等はここでは未実装）。
   */
  autoNavigateOnComplete?: boolean;
}>;

type RunToResultButtonState = Readonly<{
  disabled: boolean;
  running: boolean;
  title: string;
  label: string;
  onClick: () => Promise<void>;
}>;

export function useRunToResultButton({
  taskId,
  resetKey,
  getSubmittedProgram,
  navigateTo,
}: UseRunToResultButtonOptions): RunToResultButtonState {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  const to = useMemo(() => {
    const defaultTo = (id: string) => `/tasks/${id}/running`;
    return (navigateTo ?? defaultTo)(taskId);
  }, [navigateTo, taskId]);

  const title = useMemo(() => {
    // UI上の契約として "title" を返しているので維持
    return running ? "実行中…" : "実行して結果へ";
  }, [running]);

  const label = title;

  const onClick = useCallback(async () => {
    if (running) return;

    setRunning(true);
    try {
      // “提出内容確定” のような副作用が必要ならここで実行
      if (getSubmittedProgram) {
        await getSubmittedProgram();
      }

      // resetKey は将来のガード（同一タスクでの再実行など）に残しておく
      void resetKey;

      router.push(to);
    } finally {
      // ここで running を false に戻すと、遷移が失敗したときにだけ復帰する形になる。
      // 成功時はページ遷移するので気にしなくていい。
      setRunning(false);
    }
  }, [getSubmittedProgram, resetKey, router, running, to]);

  return {
    disabled: running,
    running,
    title,
    label,
    onClick,
  };
}