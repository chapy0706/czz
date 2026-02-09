// apps/user/app/page.tsx

import { BeginnerHud } from "@/components/beginner/beginner-hud";
import { UiModeToggle } from "@/components/beginner/ui-mode-toggle";
import { TopCtasWithSfx } from "@/components/top/top-ctas-with-sfx";
import { TopIntro } from "@/components/top/top-intro";

export default function Page() {
	return (
		<main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-5xl flex-col justify-center px-6 py-10">
			<div className="space-y-4" data-testid="top-page">
				<TopIntro />

				<TopCtasWithSfx />
			</div>

			<div className="mt-6">
				<BeginnerHud />
			</div>

			<UiModeToggle className="mt-6" />
		</main>
	);
}
