<!-- docs/runbook/debug-panel.md -->

# デバッグ運用（証拠→仮説→実験→決定）

## 目的
- 「直感」で直さない
- 何が起きたかを最短で再現し、次の一手を決める

## ループ
1. Evidence（証拠）
   - 画面/ログ/再現手順
   - make evidence のログ（out/evidence/*.log）
2. Hypothesis（仮説）
   - 1つの原因に絞る
3. Experiment（実験）
   - 変更は最小（1回で1仮説）
   - 影響範囲を小さくする
4. Result（結果）
   - 期待と実際を並べる
5. Decision（決定）
   - 次の仮説に進む or 修正完了
   - 学びは spec に反映（Spec First）

## 引継ぎに必要な情報
- 対象 spec のパス
- 変更ファイル一覧（git diff --name-only）
- git SHA
- エラー全文（省略しない）
- make evidence ログ（ファイル名）
