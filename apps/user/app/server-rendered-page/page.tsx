// apps/user/app/server-rendered-page/page.tsx
import { redirect } from "next/navigation";

export default function ServerRenderedPage() {
	redirect("/");
}
