# czz Driven Development

czz の開発は **spec / plan / verify / evidence** を軸にします。

## 用語
- **spec**: 仕様の単一の真実（SSOT）。`docs/specs/active/`
- **plan**: 実装前の最小計画（必要な場合のみ）
- **verify**: `make verify` で品質ゲートを通す
- **evidence**: `make evidence` でログを残す

## 流れ
1. Issue から spec を作る
2. spec を読んで実装する
3. `make verify` → `make evidence`
4. 引継ぎ4点（spec / diff / SHA / evidence log）を残す

## 運用リンク
- 仕様: `./specs/active/`
- 運用手順: `./runbook/`
