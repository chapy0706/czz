// apps/user/src/lib/command-builder/GesturePad.tsx
"use client";

import * as React from "react";

type Props = {
	onStepPlus: () => void;
	onStepMinus: () => void;
	canStepPlus: boolean;
	canStepMinus: boolean;
};

/**
 * Runner の「表示ステップ切り替え」専用のジェスチャ領域。
 *
 * 重要:
 * - 画面全体を覆う overlay（fixed/absolute inset-0 等）は使わない
 * - このコンポーネントの矩形領域だけがポインタ入力を受ける
 *   （＝他のボタン/UI をブロックしない）
 */
export function GesturePad({
	onStepPlus,
	onStepMinus,
	canStepPlus,
	canStepMinus,
}: Props) {
	// strictCase の命名規則回避（XRef/YRef が連続大文字扱いになるため）
	const startXref = React.useRef<number | null>(null);
	const startYref = React.useRef<number | null>(null);
	const consumedRef = React.useRef(false);

	const thresholdPx = 28; // これ以上横に動いたらスワイプ扱い
	const verticalTolerancePx = 22; // 縦ブレが大きいとスクロール優先

	const reset = () => {
		startXref.current = null;
		startYref.current = null;
		consumedRef.current = false;
	};

	const handlePointerDown = (e: React.PointerEvent<HTMLFieldSetElement>) => {
		// 右クリック等は無視
		if (e.pointerType === "mouse" && e.button !== 0) return;

		startXref.current = e.clientX;
		startYref.current = e.clientY;
		consumedRef.current = false;

		// この領域内の操作だけ確実に受ける
		e.currentTarget.setPointerCapture(e.pointerId);
	};

	const handlePointerMove = (e: React.PointerEvent<HTMLFieldSetElement>) => {
		if (startXref.current == null || startYref.current == null) return;
		if (consumedRef.current) return;

		const dx = e.clientX - startXref.current;
		const dy = e.clientY - startYref.current;

		// 縦に強く動いているならスクロール優先（操作を奪わない）
		if (Math.abs(dy) > verticalTolerancePx && Math.abs(dy) > Math.abs(dx)) {
			reset();
			return;
		}

		if (Math.abs(dx) < thresholdPx) return;

		consumedRef.current = true;

		if (dx > 0) {
			if (canStepPlus) onStepPlus();
		} else {
			if (canStepMinus) onStepMinus();
		}

		// 1スワイプ=1ステップ
		reset();
	};

	const handlePointerUp = () => reset();
	const handlePointerCancel = () => reset();

	return (
		<div className="rounded border bg-muted/20 p-3">
			{/* role="group" ではなく fieldset に寄せる（Biomeのa11y指摘に従う） */}
			<fieldset
				className="select-none rounded border bg-background p-3 text-sm text-muted-foreground"
				style={{
					// 横スワイプは取るが、縦スクロールを阻害しない
					touchAction: "pan-y",
				}}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerCancel={handlePointerCancel}
				data-testid="gesturepad"
			>
				<legend className="sr-only">Runner gesture pad</legend>

				<div className="flex items-center justify-between">
					<span className="text-xs">← swipe</span>
					<span className="text-xs">step</span>
					<span className="text-xs">swipe →</span>
				</div>

				<div className="mt-2 flex items-center justify-between text-xs">
					<span className={canStepMinus ? "" : "opacity-40"}>前へ</span>
					<span className="opacity-60">この枠内だけ操作</span>
					<span className={canStepPlus ? "" : "opacity-40"}>次へ</span>
				</div>
			</fieldset>
		</div>
	);
}
