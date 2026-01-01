E2E Helpers – Intent

目的

UI リファクタ中でも、ユーザー導線（Run → Result）を壊さない最低限の E2E 契約を維持する。

E2E が守る契約

cb-run を押せる

cb-result が「まだ実行していない / (no result)」から変化する
成否（PASS/FAIL/ERR）は問わず、状態遷移が起きることを重視する。

Overlay 無害化について（暫定対応）

Radix/shadcn の Dialog/Sheet の overlay が閉じ損なうとクリックが遮られ、E2E がタイムアウトする。
closeAnyOverlay() は Escape を試し、それでも残る overlay を pointer-events: none で無害化してテストを継続する。

TODO（UI が固まったら）

UI 側の open/close を根治して overlay が残留しないようにする。
その後、E2E の無害化処理（pointer-events の上書き）を削除し、正攻法のクリックに戻す。
