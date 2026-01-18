// apps/admin/app/page.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>czz - admin app</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>ここに課題作成用の管理画面が入ります。</p>
          <div>
            <Button asChild>
              <Link href="/tasks/new">課題を作成する</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
