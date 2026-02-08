// apps/user/app/account/[path]/page.tsx
import { redirect } from "next/navigation";

export default function AccountPathPage() {
	redirect("/account/settings");
}
