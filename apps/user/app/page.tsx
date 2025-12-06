import { ModeToggle } from "@/components/providers/mode-toggle";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">czz ユーザー画面（仮）</h1>
      <p className="text-sm text-muted-foreground">
        ダークモードが効いているかの確認用ページです。
      </p>
      <ModeToggle />
    </main>
  );
}
