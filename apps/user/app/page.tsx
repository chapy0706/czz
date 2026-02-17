// apps/user/app/page.tsx

import { BeginnerHud } from "@/components/beginner/beginner-hud";
import { UiModeToggle } from "@/components/beginner/ui-mode-toggle";
import { TopCtasWithSfx } from "@/components/top/top-ctas-with-sfx";
import { TopIntro } from "@/components/top/top-intro";

export default function Page() {
	return (
		<main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-5xl flex-col px-6 py-20">
			<div
				className="space-y-16 flex flex-col items-center text-center mt-12"
				data-testid="top-page"
			>
				<TopIntro />

				<TopCtasWithSfx />
			</div>

			<div className="mt-6 flex justify-center">
				<UiModeToggle />
			</div>

			<div className="mt-6 flex justify-center">
				<BeginnerHud />
			</div>
		</main>
	);
}
