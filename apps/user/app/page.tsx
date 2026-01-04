// apps/user/app/page.tsx
import Link from "next/link";

export default function Page() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-5xl flex-col justify-center px-6 py-10">
      <div className="space-y-4" data-testid="top-page">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded border bg-background px-2 py-1">czz</span>
          <span>Instruction Builder Game</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight">小さな命令をつないで、課題を解く</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          UNIX 的な「流れ」を、UI で組み立てて学ぶゲーム。コマンドを並べて実行し、テストで確かめる。
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          <Link
            href="/tasks"
            className="rounded border bg-accent px-4 py-2 text-sm hover:opacity-90"
            data-testid="top-cta-tasks"
          >
            はじめる（課題一覧）
          </Link>

          <Link
            href="/result"
            className="rounded border bg-background px-4 py-2 text-sm hover:bg-accent"
            data-testid="top-cta-latest-result"
          >
            直近のリザルト
          </Link>
        </div>

        <div className="pt-6 text-xs text-muted-foreground">
          ヒント：まずは 1 つだけコマンドを置いて、動作を観察すると理解が速い。
        </div>
      </div>
    </main>
  );
}
